import { browser } from '$app/environment';
import { refreshAll } from '$app/navigation';
import type { RemoteQuery } from '@sveltejs/kit';
import { logUser } from '@lib/loggers';
import { type AutoRefresh, type AutoRefreshOptions, type QueryLike, WrappedPromise, autoRefresh } from '@lib/utils';
import { queryCurrentUserInfo } from './auth.remote';
import type { CurrentUser } from './authContext.svelte';

const UPDATE_INTERVAL_MS = 15 * 60 * 1000;

export type CurrentUserStoreOptions = AutoRefreshOptions;
export type CurrentUserStore = QueryLike<CurrentUser> & AutoRefresh;

/// The user store for server side, that disables any use query and always returns unauthenticated user.
/// This is to prevent any accidental use of user store in server side code, which may cause leaking of user information to other users.
class ServerCurrentUserStore extends WrappedPromise<CurrentUser> implements CurrentUserStore {
    protected readonly _promise = Promise.resolve({ authenticated: false } satisfies CurrentUser);

    get loading(): boolean {
        return false;
    }

    get error() {
        return undefined;
    }

    get current() {
        return { authenticated: false } satisfies CurrentUser;
    }

    get lastUpdate() {
        return new Date(Date.now());
    }

    get timeToRefresh() {
        return 0;
    }

    refresh() {
        return Promise.resolve();
    }
}

/// The user store for browser side.
/// It will automatically refresh the user information in the background based on the provided options.
class BrowserCurrentUserStore extends WrappedPromise<CurrentUser> implements CurrentUserStore {
    protected readonly _promise: RemoteQuery<CurrentUser>;
    private readonly _autoRefresh: AutoRefresh;
    private _lastIdentity: string | null = null;

    constructor(options?: CurrentUserStoreOptions) {
        super();

        this._promise = queryCurrentUserInfo();
        this._autoRefresh = autoRefresh(
            () => this._promise.refresh(),
            () => !this._promise.loading,
            {
                ...options,
                maxTTL: options?.maxTTL ?? UPDATE_INTERVAL_MS
            }
        );

        // When a background refresh reveals a different identity - the user
        // switched accounts, logged in, or the session expired - re-run every
        // active remote function so the page drops the previous user's data.
        $effect(() => {
            const user = this._promise.current;
            if (!user) return;

            const identity = user.authenticated ? `user:${user.id}` : 'anonymous';
            if (this._lastIdentity !== null && this._lastIdentity !== identity && identity !== 'anonymous') {
                // Only refresh when switching between authenticated identities — going anonymous
                // means the auth layout will redirect away, so invalidating here would race with goto.
                logUser.log('Identity changed, refreshing all queries');
                void refreshAll();
            }
            this._lastIdentity = identity;
        });
    }

    get loading(): boolean {
        return this._promise.loading;
    }

    get error() {
        return this._promise.error;
    }

    get current() {
        return this._promise.current;
    }

    get lastUpdate() {
        return this._autoRefresh.lastUpdate;
    }

    get timeToRefresh() {
        return this._autoRefresh.timeToRefresh;
    }

    refresh() {
        return this._promise.refresh();
    }
}

export function createCurrentUserStore(options?: CurrentUserStoreOptions): CurrentUserStore {
    return browser ? new BrowserCurrentUserStore(options) : new ServerCurrentUserStore();
}
