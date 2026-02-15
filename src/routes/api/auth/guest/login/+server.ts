import { error } from '@sveltejs/kit';
import { authUrl } from '@lib/server/api/auth';
import { getPassThroughHeaders, sanitizedReturnUrl } from '@lib/server/utils';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, fetch }) => {
    const identityUrl = authUrl.guestLoginUrl({
        captcha: url.searchParams.get('captcha') || '',
        redirectUrl: sanitizedReturnUrl(url.searchParams.get('returnUrl'))
    });
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
        console.error('Guest auth proxy error:', err);
        throw error(502, 'Failed to connect to identity server');
    }
};
