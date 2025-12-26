import { config } from '@config';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import z from 'zod';
import { applyMock, getCurrentMock } from '@mocks/currentMocks';
import { parseRequest } from '@lib/utils';

const MockSchema = z.object({
    user: z.string().optional()
});

export const GET: RequestHandler = async () => {
    if (config.environment !== 'mock') {
        throw error(403, 'Mock switching is only available in mock mode');
    }

    return json(getCurrentMock());
};

export const PATCH: RequestHandler = async ({ request }) => {
    if (config.environment !== 'mock') {
        throw error(403, 'Mock switching is only available in mock mode');
    }

    const patch = await parseRequest(MockSchema, request);
    applyMock(patch);

    return json(getCurrentMock());
};
