import { getContext, setContext } from 'svelte';
import type { WithLoading, WithRefresh } from '#lib/utils';

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

/// The current user as seen from inside `AuthGuard`, which is the only way a guarded page shall reach
/// it.
/// Note that `loading` can only ever report a *background* update here.
export type AuthenticatedUserContext = WithLoading &
    WithRefresh & {
        readonly user: AuthenticatedCurrentUser;

        /// Forces a re-read of the session and reports whether it is still live. Resolves `false`
        /// only when the server says the session is gone, and by then the guard is already
        /// redirecting to login - so a caller that gets `false` should simply abandon what it was
        /// about to do rather than report anything to the user.
        ///
        /// Never rejects: an unreachable identity server reports the last known state (`true` inside
        /// the guard), so `false` means the server disowned the session, not that it was unreachable
        /// - and if it did die, the backend rejects the caller's own request anyway.
        revalidateSession: () => Promise<boolean>;
    };

export function setAuthenticatedUserContext(ctx: AuthenticatedUserContext): void {
    setContext(AUTHENTICATED_USER_CONTEXT_KEY, ctx);
}

export function getAuthenticatedUserContext(): AuthenticatedUserContext {
    const ctx = getContext<AuthenticatedUserContext | undefined>(AUTHENTICATED_USER_CONTEXT_KEY);
    if (!ctx) throw new Error('getAuthenticatedUserContext: called outside AuthGuard');
    return ctx;
}
