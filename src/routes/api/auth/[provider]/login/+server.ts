import { resolve } from '$app/paths';
import { error, redirect } from '@sveltejs/kit';
import { logAPI } from '@lib/loggers';
import { authUrl } from '@lib/server/api/auth';
import {
    filterIncompatibleHeaders,
    getPassThroughHeaders,
    sanitizedReturnUrl,
    validateProxyResponse
} from '@lib/server/utils';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url, fetch }) => {
    const provider = params.provider;
    if (!provider) {
        throw error(400, 'Provider parameter is required');
    }

    const identityUrl = authUrl.externalLoginUrl(provider, {
        captcha: url.searchParams.get('captcha') || '',
        redirectUrl: sanitizedReturnUrl(url.searchParams.get('returnUrl')),
        rememberMe: url.searchParams.get('rememberMe') === 'true'
    });
    const headers = getPassThroughHeaders();

    let response;
    try {
        response = await fetch(identityUrl, {
            method: 'GET',
            headers,
            redirect: 'manual' // Don't follow redirects, let the client handle them
        });
    } catch (err) {
        logAPI.error('Auth proxy error:', err);
        throw redirect(302, resolve('/error') + '?errorType=server-down');
    }

    validateProxyResponse(response);

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: filterIncompatibleHeaders(response.headers)
    });
};
