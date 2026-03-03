import { config } from '@config';
import type { RequestHandler as MswRequestHandler } from 'msw';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    if (config.environment !== 'mock') {
        return new Response(null, { status: 404 });
    }

    const { registry } = await import('@mocks/registry');
    const { addOverride } = await import('@mocks/server');

    const { handler, params } = await request.json();
    const factory = registry[handler as keyof typeof registry];
    if (!factory) {
        return new Response(JSON.stringify({ error: `Unknown handler: ${handler}` }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const mswHandler: MswRequestHandler =
        params === undefined
            ? (factory as () => MswRequestHandler)()
            : (factory as (handlerParams: unknown) => MswRequestHandler)(params);
    addOverride(handler, mswHandler);

    return new Response(JSON.stringify({ ok: true, handler }), {
        headers: { 'Content-Type': 'application/json' }
    });
};

export const DELETE: RequestHandler = async ({ request }) => {
    if (config.environment !== 'mock') {
        return new Response(null, { status: 404 });
    }

    const { removeOverride, resetOverrides } = await import('@mocks/server');

    const text = await request.text();
    if (text) {
        const { handler } = JSON.parse(text);
        removeOverride(handler);
        return new Response(JSON.stringify({ ok: true, removed: handler }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    resetOverrides();
    return new Response(JSON.stringify({ ok: true, reset: true }), {
        headers: { 'Content-Type': 'application/json' }
    });
};
