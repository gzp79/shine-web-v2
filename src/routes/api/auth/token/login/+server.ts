import { error } from '@sveltejs/kit';
import { authUrl } from '@lib/server/api/auth';
import { getPassThroughHeaders, sanitizedReturnUrl } from '@lib/server/utils';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, fetch }) => {
    const returnUrl = url.searchParams.get('returnUrl');

    const redirectUrl = sanitizedReturnUrl(returnUrl);
    const errorUrl = `/login?${new URLSearchParams({
        ...(returnUrl ? { returnUrl } : {}),
        prompt: 'true'
    })}`;

    const identityUrl = authUrl.tokenLoginUrl({ redirectUrl, errorUrl });
    const headers = getPassThroughHeaders();

    try {
        const response = await fetch(identityUrl, {
            method: 'GET',
            headers,
            redirect: 'manual'
        });

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        });
    } catch (err) {
        console.error('Token auth proxy error:', err);
        throw error(502, 'Failed to connect to identity server');
    }
};
