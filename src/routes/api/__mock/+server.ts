import type { RequestHandler } from './$types';

// Identifies the calling Playwright worker; absent for the admin page.
const WORKER_HEADER = 'x-mock-worker';

export const POST: RequestHandler = async ({ request }) => {
    if (!import.meta.env.VITE_MOCK) {
        return new Response(null, { status: 404 });
    }

    const { addOverride } = await import('@mocks/server');

    const workerId = request.headers.get(WORKER_HEADER) ?? undefined;
    const { handler, params } = await request.json();

    try {
        await addOverride(handler, params, workerId);
    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ ok: true, handler }), {
        headers: { 'Content-Type': 'application/json' }
    });
};

export const GET: RequestHandler = async ({ request }) => {
    if (!import.meta.env.VITE_MOCK) {
        return new Response(null, { status: 404 });
    }

    const { registry } = await import('@mocks/registry');
    const { getActiveOverrides } = await import('@mocks/server');

    const workerId = request.headers.get(WORKER_HEADER) ?? undefined;
    const activeOverrides = getActiveOverrides(workerId);
    const mocks: Array<{ name: string; isActive: boolean; hasParams: boolean; params?: unknown }> = [];

    // 1. Add active overrides (in application order - Map preserves insertion order)
    for (const [name, entry] of activeOverrides.entries()) {
        const registryEntry = registry[name as keyof typeof registry];
        const hasParams = 'defaultParams' in registryEntry;
        mocks.push({
            name,
            isActive: true,
            hasParams,
            params: entry.params
        });
    }

    // 2. Add inactive mocks (alphabetically)
    const registryKeys = Object.keys(registry).sort();
    for (const name of registryKeys) {
        if (!activeOverrides.has(name)) {
            const registryEntry = registry[name as keyof typeof registry];
            const hasParams = 'defaultParams' in registryEntry;
            const defaultParams = hasParams ? registryEntry.defaultParams : undefined;
            mocks.push({
                name,
                isActive: false,
                hasParams,
                params: defaultParams
            });
        }
    }

    return new Response(JSON.stringify({ mocks }), {
        headers: { 'Content-Type': 'application/json' }
    });
};

export const DELETE: RequestHandler = async ({ request }) => {
    if (!import.meta.env.VITE_MOCK) {
        return new Response(null, { status: 404 });
    }

    const { removeOverride, resetOverrides } = await import('@mocks/server');

    const workerId = request.headers.get(WORKER_HEADER) ?? undefined;
    const text = await request.text();
    if (text) {
        const { handler } = JSON.parse(text);
        removeOverride(handler, workerId);
        return new Response(JSON.stringify({ ok: true, removed: handler }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    resetOverrides(workerId);
    return new Response(JSON.stringify({ ok: true, reset: true }), {
        headers: { 'Content-Type': 'application/json' }
    });
};
