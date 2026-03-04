import type { RequestHandler } from 'msw';
import { setupServer } from 'msw/node';
import {
    defaultActiveSessions,
    defaultActiveTokens,
    defaultLinkedIdentities,
    revokeTokenHandler,
    unlinkIdentityHandler
} from './data/account/mocks';
import { defaultExternalLink, defaultExternalLogin, defaultGuestLogin, tokenLogin } from './data/auth/mocks';
import { defaultProviders } from './data/providers/mocks';
import { defaultGuestUser, unauthorizedUser } from './data/users/mock';

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
    defaultExternalLogin,
    defaultExternalLink,
    defaultActiveSessions,
    defaultActiveTokens,
    defaultLinkedIdentities,
    revokeTokenHandler,
    unlinkIdentityHandler
];

export const server = setupServer(...mockForGuestUser);

// --- Mock control API state ---
// Tracks overrides added via the /api/__mock endpoint.
// MSW's server.use() prepends handlers, server.resetHandlers() removes all runtime handlers.
export type OverrideEntry = { handler: RequestHandler; params: unknown };
const activeOverrides = new Map<string, OverrideEntry>();

function reapplyHandlers(): void {
    server.resetHandlers();
    if (activeOverrides.size > 0) {
        const handlers = Array.from(activeOverrides.values()).map((entry) => entry.handler);
        server.use(...handlers);
    }
}

export async function addOverride(name: string, params: unknown): Promise<void> {
    const { registry } = await import('@mocks/registry');
    const registryEntry = registry[name as keyof typeof registry];

    if (!registryEntry) {
        throw new Error(`Unknown handler: ${name}`);
    }

    const handler: RequestHandler =
        params === undefined
            ? (registryEntry.factory as () => RequestHandler)()
            : (registryEntry.factory as (handlerParams: unknown) => RequestHandler)(params);

    activeOverrides.set(name, { handler, params });

    // Reset server and re-register all handlers to ensure updates take effect
    reapplyHandlers();
}

export function removeOverride(name: string): void {
    activeOverrides.delete(name);
    reapplyHandlers();
}

export function getActiveOverrides(): Map<string, OverrideEntry> {
    return activeOverrides;
}

export function resetOverrides(): void {
    activeOverrides.clear();
    server.resetHandlers();
}
