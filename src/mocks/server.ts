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
    ...mockForGuestUser
);

// --- Mock control API state ---
// Tracks overrides added via the /api/__mock endpoint.
// MSW's server.use() prepends handlers, server.resetHandlers() removes all runtime handlers.
const activeOverrides = new Map<string, RequestHandler>();

export function addOverride(name: string, handler: RequestHandler): void {
    activeOverrides.set(name, handler);
    server.use(handler);
}

export function removeOverride(name: string): void {
    activeOverrides.delete(name);
    server.resetHandlers();
    if (activeOverrides.size > 0) {
        server.use(...activeOverrides.values());
    }
}

export function resetOverrides(): void {
    activeOverrides.clear();
    server.resetHandlers();
}
