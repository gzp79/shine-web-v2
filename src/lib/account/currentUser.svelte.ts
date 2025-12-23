import { getContext, setContext } from 'svelte';
import { EnhancedQuery, type EnhancedQueryOptions } from '@lib/utils/enhanced-query.svelte';
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

export class CurrentUserStore extends EnhancedQuery<CurrentUser> {
    constructor(options?: EnhancedQueryOptions) {
        super(queryCurrentUserInfo(), { ...options, ttl: options?.ttl ?? UPDATE_INTERVAL_MS });
    }

    isAuthenticated(): this is CurrentUserStore & { current: AuthenticatedCurrentUser } {
        return !!this.current && this.current.authenticated;
    }
}

export function setCurrentUserStore(options?: EnhancedQueryOptions): CurrentUserStore {
    const store = new CurrentUserStore(options);
    setContext(CURRENT_USER_CONTEXT_KEY, store);
    return store;
}

export function getCurrentUserStore(): CurrentUserStore {
    return getContext<CurrentUserStore>(CURRENT_USER_CONTEXT_KEY);
}
