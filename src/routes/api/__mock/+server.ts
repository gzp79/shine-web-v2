import { config } from '@config';
import { registry } from '@mocks/registry';
import { addOverride, removeOverride, resetOverrides } from '@mocks/server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    if (config.environment === 'prod') {
        return new Response(null, { status: 404 });
    }

    const { handler, params } = await request.json();
    const factory = registry[handler as keyof typeof registry];
    if (!factory) {
        return new Response(JSON.stringify({ error: `Unknown handler: ${handler}` }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const mswHandler = (factory as Function)(params);
    addOverride(handler, mswHandler);

    return new Response(JSON.stringify({ ok: true, handler }), {
        headers: { 'Content-Type': 'application/json' }
    });
};

export const DELETE: RequestHandler = async ({ request }) => {
    if (config.environment === 'prod') {
        return new Response(null, { status: 404 });
    }

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
