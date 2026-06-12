import { browser } from '$app/environment';
import type { RemoteQuery } from '@sveltejs/kit';
import { getContext, setContext } from 'svelte';
import { type AutoRefresh, type AutoRefreshOptions, type QueryLike, WrappedPromise, autoRefresh } from '@lib/utils';
import { queryCurrentUserInfo } from './auth.remote';

const UPDATE_INTERVAL_MS = 15 * 60 * 1000;
const CURRENT_USER_CONTEXT_KEY = Symbol('current-user-context');

export type AuthenticatedCurrentUser = {
    authenticated: true;
    id: string;
    isLinked: boolean;
    name: string;
    email: string;
    isEmailVerified: boolean;
    createdAt: Date;
};
export type UnauthenticatedCurrentUser = {
    authenticated: false;
};
export type CurrentUser = AuthenticatedCurrentUser | UnauthenticatedCurrentUser;

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

    constructor(options?: CurrentUserStoreOptions) {
        super();

        this._promise = queryCurrentUserInfo();
        this._autoRefresh = autoRefresh(this._promise.refresh, this._promise.loading, {
            maxTTL: options?.maxTTL ?? UPDATE_INTERVAL_MS,
            ...options
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

export function setCurrentUserStore(options?: CurrentUserStoreOptions): CurrentUserStore {
    const store = browser ? new BrowserCurrentUserStore(options) : new ServerCurrentUserStore();
    setContext(CURRENT_USER_CONTEXT_KEY, store);
    return store;
}

export function getCurrentUserStore(): CurrentUserStore {
    const store = getContext<CurrentUserStore | undefined>(CURRENT_USER_CONTEXT_KEY);
    if (!store) throw new Error('getCurrentUserStore: called outside CurrentUserStore provider');
    return store;
}
