import type { RequestHandler } from 'msw';
import { setupServer } from 'msw/node';
import {
    defaultActiveSessions,
    defaultActiveTokens,
    defaultLinkedIdentities,
    revokeTokenHandler,
    startEmailChangeHandler,
    startEmailConfirmationHandler,
    unlinkIdentityHandler
} from './data/account/mocks';
import { defaultProviders } from './data/providers/mocks';
import { defaultGuestUser, defaultPublicUserInfo, unauthorizedUser } from './data/users/mock';

export const mockForLoginPage: Array<RequestHandler> = [defaultProviders, unauthorizedUser];

export const mockForGuestUser: Array<RequestHandler> = [
    defaultProviders,
    defaultGuestUser,
    defaultActiveSessions,
    defaultActiveTokens,
    defaultLinkedIdentities,
    revokeTokenHandler,
    unlinkIdentityHandler,
    startEmailConfirmationHandler,
    startEmailChangeHandler,
    defaultPublicUserInfo
];

export const server = setupServer(...mockForGuestUser);

// --- Mock control API state ---
// Overrides added via /api/__mock are partitioned per Playwright worker so
// workers can run in parallel without their mock state colliding.
//
// How the per-worker scoping works:
//
// 1. Storage. Overrides are kept in `overridesByWorker`, a two-level map keyed
//    first by worker id, then by handler name. Each worker thus has its own
//    isolated bucket of overrides; mutating one bucket never touches another.
//
// 2. Tagging requests. Every request that should be scoped carries an
//    `x-mock-worker` header naming its worker. The test fixture sets it on the
//    browser context, and getPassThroughHeaders re-attaches it to the outbound
//    fetch the SvelteKit server makes to the (mocked) backend — so the header
//    survives the browser -> server -> fetch hop and is present on the request
//    MSW actually sees.
//
// 3. Scoping a handler. When an override is registered, `scopeHandlerToWorker`
//    produces a copy of the handler (via Object.create, leaving the original —
//    often a shared singleton — untouched) whose `run` is overridden. That
//    `run` reads `x-mock-worker` off the incoming request: if it matches the
//    worker the copy belongs to, it delegates to the real handler; otherwise it
//    returns null.
//
// 4. Resolution. `reapplyHandlers` rebuilds MSW's active stack as
//    [every worker's scoped overrides..., ...mockForGuestUser]. For a given
//    request MSW tries each handler in order. A scoped copy belonging to a
//    different worker returns null, which MSW treats as "no match, keep going",
//    so the request falls through past other workers' overrides until it hits
//    either this worker's own override or the shared baseline.
//
// Outside a Playwright worker — the /__test/mocks admin page, or a manual
// curl — requests carry no `x-mock-worker` header, so they resolve to
// DEFAULT_WORKER and share one bucket. A default-bucket override matches only
// other untagged requests, keeping it isolated from any worker-tagged traffic
// just as workers are isolated from each other.
export type OverrideEntry = { handler: RequestHandler; params: unknown };

export const WORKER_HEADER = 'x-mock-worker';

// Outer key is the worker id (or DEFAULT_WORKER when none was provided).
const DEFAULT_WORKER = '__default__';
const overridesByWorker = new Map<string, Map<string, OverrideEntry>>();

function bucketFor(workerId: string | undefined, create: boolean): Map<string, OverrideEntry> | undefined {
    const key = workerId ?? DEFAULT_WORKER;
    let bucket = overridesByWorker.get(key);
    if (!bucket && create) {
        bucket = new Map<string, OverrideEntry>();
        overridesByWorker.set(key, bucket);
    }
    return bucket;
}

// See step 3 above. Returns a copy of `handler` that delegates to it only for
// its own worker's requests, and returns null otherwise so MSW falls through.
function scopeHandlerToWorker(handler: RequestHandler, workerId: string): RequestHandler {
    const scoped: RequestHandler = Object.create(handler);
    scoped.run = (args) => {
        const requestWorker = args.request.headers.get(WORKER_HEADER) ?? DEFAULT_WORKER;
        return requestWorker === workerId ? handler.run(args) : Promise.resolve(null);
    };
    return scoped;
}

function reapplyHandlers(): void {
    server.resetHandlers(...mockForGuestUser);
    const handlers: RequestHandler[] = [];
    for (const bucket of overridesByWorker.values()) {
        for (const entry of bucket.values()) {
            handlers.push(entry.handler);
        }
    }
    if (handlers.length > 0) {
        server.use(...handlers);
    }
}

export async function addOverride(name: string, params: unknown, workerId?: string): Promise<void> {
    const { registry } = await import('@mocks/registry');
    const registryEntry = registry[name as keyof typeof registry];

    if (!registryEntry) {
        throw new Error(`Unknown handler: ${name}`);
    }

    const handler: RequestHandler =
        params === undefined
            ? (registryEntry.factory as () => RequestHandler)()
            : (registryEntry.factory as (handlerParams: unknown) => RequestHandler)(params);

    const bucket = bucketFor(workerId, true)!;
    bucket.set(name, { handler: scopeHandlerToWorker(handler, workerId ?? DEFAULT_WORKER), params });
    reapplyHandlers();
}

export function removeOverride(name: string, workerId?: string): void {
    const bucket = bucketFor(workerId, false);
    if (bucket) {
        bucket.delete(name);
        if (bucket.size === 0) {
            overridesByWorker.delete(workerId ?? DEFAULT_WORKER);
        }
    }
    reapplyHandlers();
}

export function getActiveOverrides(workerId?: string): Map<string, OverrideEntry> {
    return bucketFor(workerId, false) ?? new Map<string, OverrideEntry>();
}

export function resetOverrides(workerId?: string): void {
    overridesByWorker.delete(workerId ?? DEFAULT_WORKER);
    reapplyHandlers();
}
