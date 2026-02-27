// src/mocks/registry.ts
import type { RequestHandler } from 'msw';
import { defaultExternalLogin, defaultGuestLogin, tokenLogin } from './data/auth/mocks';
import { defaultProviders } from './data/providers/mocks';
import { defaultGuestUser, unauthorizedUser } from './data/users/mock';
import { withDelay, withIdentityDown } from './middleware';

export interface MockHandlers {
    defaultProviders: void;
    unauthorizedUser: void;
    defaultGuestUser: void;
    defaultGuestLogin: void;
    defaultExternalLogin: void;
    tokenLogin: { success: boolean };
    withIdentityDown: void;
    withDelay: { ms: number };
}

type HandlerFactory<K extends keyof MockHandlers> = MockHandlers[K] extends void
    ? () => RequestHandler
    : (params: MockHandlers[K]) => RequestHandler;

export const registry: { [K in keyof MockHandlers]: HandlerFactory<K> } = {
    defaultProviders: () => defaultProviders,
    unauthorizedUser: () => unauthorizedUser,
    defaultGuestUser: () => defaultGuestUser,
    defaultGuestLogin: () => defaultGuestLogin,
    defaultExternalLogin: () => defaultExternalLogin,
    tokenLogin: (params) => tokenLogin(params.success),
    withIdentityDown: () => withIdentityDown,
    withDelay: (params) => withDelay(params.ms)
};
