import type { RequestHandler } from 'msw';
import { setupServer } from 'msw/node';
import { defaultExternalLogin, defaultGuestLogin } from './data/auth/mocks';
import { defaultProviders } from './data/providers/mocks';
import { defaultGuestUser, unauthorizedUser } from './data/users/mock';

export const mockForLoginPage: Array<RequestHandler> = [
    defaultProviders,
    unauthorizedUser,
    defaultExternalLogin,
    defaultGuestLogin
];

export const mockForGuestUser: Array<RequestHandler> = [
    defaultProviders,
    defaultGuestUser,
    defaultExternalLogin,
    defaultGuestLogin
];

export const server = setupServer(...mockForGuestUser);
