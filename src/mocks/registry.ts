// src/mocks/registry.ts
import {
    defaultActiveSessions,
    defaultActiveTokens,
    defaultLinkedIdentities,
    revokeTokenHandler,
    unlinkIdentityHandler
} from './data/account/mocks';
import { defaultExternalLogin, defaultGuestLogin, tokenLogin } from './data/auth/mocks';
import { defaultProviders } from './data/providers/mocks';
import { defaultGuestUser, unauthorizedUser } from './data/users/mock';
import { withDelay, withIdentityDown } from './middleware';

// Registry of all mock handlers for easy reference in tests and mock control API
export const registry = {
    defaultProviders: () => defaultProviders,
    unauthorizedUser: () => unauthorizedUser,
    defaultGuestUser: () => defaultGuestUser,
    defaultGuestLogin: () => defaultGuestLogin,
    defaultExternalLogin: () => defaultExternalLogin,
    tokenLogin: (params: { success: boolean }) => tokenLogin(params.success),
    withIdentityDown: () => withIdentityDown,
    withDelay: (params: { ms: number }) => withDelay(params.ms),
    defaultActiveSessions: () => defaultActiveSessions,
    defaultActiveTokens: () => defaultActiveTokens,
    defaultLinkedIdentities: () => defaultLinkedIdentities,
    revokeTokenHandler: () => revokeTokenHandler,
    unlinkIdentityHandler: () => unlinkIdentityHandler
};

// Infer the MockHandlers type from the registry
export type MockHandlers = {
    [K in keyof typeof registry]: Parameters<(typeof registry)[K]>[0] extends undefined
        ? void
        : Parameters<(typeof registry)[K]>[0];
};
