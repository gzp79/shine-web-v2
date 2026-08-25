import { error, json } from '@sveltejs/kit';
import z from 'zod';
import { logAPI } from '@lib/loggers';
import { PUBLIC_USER_INFO_MAX_IDS, PublicUserInfoResponseSchema, userApiRoutes } from '@lib/server/api/userApiRoutes';
import { getPassThroughHeaders } from '@lib/server/utils';
import { createFetchError, parseResponse, retryWithBackoff } from '@lib/utils';
import type { RequestHandler } from './$types';

const RequestSchema = z.object({
    ids: z.array(z.string().min(1).max(128)).min(1).max(PUBLIC_USER_INFO_MAX_IDS)
});

/**
 * BFF for public user info: the browser never learns the identity service url or the
 * credentials used to reach it. Validation failures deliberately do not echo the input.
 */
export const POST: RequestHandler = async ({ request }) => {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        error(400, 'Invalid request body');
    }

    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
        error(400, 'Invalid user id list');
    }

    const ids = [...new Set(parsed.data.ids)];

    const headers = getPassThroughHeaders();
    headers.set('content-type', 'application/json');

    return await retryWithBackoff(async (retry) => {
        const response = await fetch(userApiRoutes.publicUserInfo(), {
            method: 'POST',
            headers,
            body: JSON.stringify({ userIds: ids })
        });

        if (response.ok) {
            const { users } = await parseResponse(PublicUserInfoResponseSchema, response);
            // Re-project so only the public fields ever reach the browser.
            const publicUsers = Object.fromEntries(
                Object.entries(users).map(([id, user]) => [id, { name: user.name }])
            );
            return json({ users: publicUsers });
        }

        if (response.status === 401) {
            error(401, 'Unauthenticated');
        }

        if (response.status === 400) {
            error(400, 'Invalid user id list');
        }

        const err = await createFetchError(response, 'Failed to resolve public user info');
        logAPI.error(`getPublicUserInfo failed, retry ${retry.current}/${retry.limit}`, err);
        return retry(err);
    });
};
