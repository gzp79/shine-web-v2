import type { RequestHandler } from 'msw';
import { setupServer } from 'msw/node';
import { defaultExternalLogin, defaultGuestLogin, tokenLogin } from './data/auth/mocks';
import { defaultProviders } from './data/providers/mocks';
import { defaultGuestUser, unauthorizedUser } from './data/users/mock';
import { withDelay, withLog } from './middleware';

export const mockForLoginPage: Array<RequestHandler> = [
    defaultProviders,
    unauthorizedUser,
    defaultGuestLogin,
    tokenLogin(false),
    defaultExternalLogin
];

export const mockForGuestUser: Array<RequestHandler> = [
    defaultProviders,
    defaultGuestUser,
    defaultGuestLogin,
    tokenLogin(true),
    defaultExternalLogin
];

export const server = setupServer(
    withLog, //
    withDelay(5000),
    ...mockForLoginPage
);
