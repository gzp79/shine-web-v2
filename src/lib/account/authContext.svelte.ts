import { getContext, setContext } from 'svelte';

const AUTHENTICATED_USER_CONTEXT_KEY = Symbol('authenticated-user-context');

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

export type AuthenticatedUserContext = {
    readonly user: AuthenticatedCurrentUser;
    refresh: () => Promise<void>;
};

export function setAuthenticatedUserContext(ctx: AuthenticatedUserContext): void {
    setContext(AUTHENTICATED_USER_CONTEXT_KEY, ctx);
}

export function getAuthenticatedUserContext(): AuthenticatedUserContext {
    const ctx = getContext<AuthenticatedUserContext | undefined>(AUTHENTICATED_USER_CONTEXT_KEY);
    if (!ctx) throw new Error('getAuthenticatedUserContext: called outside AuthGuard');
    return ctx;
}
