import { error } from '@sveltejs/kit';
import { authUrl } from '@lib/server/api/auth';
import { getPassThroughHeaders } from '@lib/server/utils';
import type { RequestHandler } from './$types';

/**
 * Simple pass-through proxy that forwards authentication requests to the identity server
 * with all original client headers (User-Agent, IP, etc.) and query parameters
 */
export const GET: RequestHandler = async ({ params, url, fetch }) => {
    const provider = params.provider;

    // Validate provider parameter
    if (!provider) {
        throw error(400, 'Provider parameter is required');
    }

    // Build the identity server URL - just forward all query parameters as-is
    const identityUrl = authUrl.externalLoginUrl(provider, {
        captcha: url.searchParams.get('captcha') || '',
        redirectUrl: url.searchParams.get('returnUrl') || '/game',
        rememberMe: url.searchParams.get('rememberMe') === 'true'
    });
    const headers = getPassThroughHeaders();

    try {
        // Forward the request to identity server with ALL original headers
        const response = await fetch(identityUrl, {
            method: 'GET',
            headers,
            redirect: 'manual' // Don't follow redirects, let the client handle them
        });

        // Forward the entire response (status, headers, body, cookies)
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        });
    } catch (err) {
        console.error('Auth proxy error:', err);
        throw error(502, 'Failed to connect to identity server');
    }
};
