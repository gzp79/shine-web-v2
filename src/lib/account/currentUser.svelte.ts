import { browser } from '$app/environment';
import type { RemoteQuery } from '@sveltejs/kit';
import { getContext, setContext } from 'svelte';
import { type AutoRefresh, type AutoRefreshOptions, type QueryLike, WrappedPromise, autoRefresh } from '@lib/utils';
import { queryCurrentUserInfo } from './account.remote';

const UPDATE_INTERVAL_MS = 15 * 60 * 1000;
const CURRENT_USER_CONTEXT_KEY = Symbol('current-user-context');

type AuthenticatedCurrentUser = {
    authenticated: true;
    id: string;
    name: string;
    email: string;
};
type UnauthenticatedCurrentUser = {
    authenticated: false;
};
export type CurrentUser = AuthenticatedCurrentUser | UnauthenticatedCurrentUser;

export type CurrentUserStoreOptions = AutoRefreshOptions;
export type CurrentUserStore = QueryLike<CurrentUser> & AutoRefresh;

/// The disabled user store for server side
class DisabledCurrentUser extends WrappedPromise<CurrentUser> implements CurrentUserStore {
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

/// The current user store for browser side
class QueryCurrentUser extends WrappedPromise<CurrentUser> implements CurrentUserStore {
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
    const store = browser ? new QueryCurrentUser(options) : new DisabledCurrentUser();
    setContext(CURRENT_USER_CONTEXT_KEY, store);
    return store;
}

export function getCurrentUserStore(): CurrentUserStore {
    return getContext<CurrentUserStore>(CURRENT_USER_CONTEXT_KEY);
}
