// src/mocks/registry.ts
/*
 * Registry Migration: Adding defaultParams structure
 * Old: registry = { mockName: () => handler }
 * New: registry = { mockName: { factory: (params) => handler, defaultParams: {...} } }
 */
import {
    defaultActiveSessions,
    defaultActiveTokens,
    defaultLinkedIdentities,
    revokeTokenFailureHandler,
    revokeTokenHandler,
    startEmailChangeHandler,
    startEmailConfirmationHandler,
    unlinkIdentityHandler
} from './data/account/mocks';
import { defaultProviders } from './data/providers/mocks';
import { defaultGuestUser, unauthorizedUser, unverifiedUserHandler, verifiedUserHandler } from './data/users/mock';
import { withDelay, withIdentityDown } from './middleware';

// Registry of all mock handlers for easy reference in tests and mock control API
export const registry = {
    defaultProviders: { factory: () => defaultProviders },
    unauthorizedUser: { factory: () => unauthorizedUser },
    defaultGuestUser: { factory: () => defaultGuestUser },
    verifiedUser: { factory: () => verifiedUserHandler },
    unverifiedUser: { factory: () => unverifiedUserHandler },
    withIdentityDown: { factory: () => withIdentityDown },
    withDelay: {
        factory: (params: { ms: number }) => withDelay(params.ms),
        defaultParams: { ms: 5000 }
    },
    defaultActiveSessions: { factory: () => defaultActiveSessions },
    defaultActiveTokens: { factory: () => defaultActiveTokens },
    defaultLinkedIdentities: { factory: () => defaultLinkedIdentities },
    revokeTokenHandler: { factory: () => revokeTokenHandler },
    revokeTokenFailure: { factory: () => revokeTokenFailureHandler },
    unlinkIdentityHandler: { factory: () => unlinkIdentityHandler },
    startEmailConfirmationHandler: { factory: () => startEmailConfirmationHandler },
    startEmailChangeHandler: { factory: () => startEmailChangeHandler }
};

// Infer the MockHandlers type from the registry
export type MockHandlers = {
    [K in keyof typeof registry]: 'defaultParams' extends keyof (typeof registry)[K]
        ? (typeof registry)[K]['defaultParams']
        : void;
};
