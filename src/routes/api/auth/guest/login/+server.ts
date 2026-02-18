import { resolve } from '$app/paths';
import { redirect } from '@sveltejs/kit';
import { logAPI } from '@lib/loggers';
import { authUrl } from '@lib/server/api/auth';
import {
    filterIncompatibleHeaders,
    getPassThroughHeaders,
    sanitizedReturnUrl,
    validateProxyResponse
} from '@lib/server/utils';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, fetch }) => {
    const identityUrl = authUrl.guestLoginUrl({
        captcha: url.searchParams.get('captcha') || '',
        redirectUrl: sanitizedReturnUrl(url.searchParams.get('returnUrl'))
    });
    const headers = getPassThroughHeaders();

    let response;
    try {
        response = await fetch(identityUrl, {
            method: 'GET',
            headers,
            redirect: 'manual'
        });
    } catch (err) {
        logAPI.error('Guest auth proxy error:', err);
        throw redirect(302, resolve('/error') + '?errorType=server-down');
    }

    validateProxyResponse(response);

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: filterIncompatibleHeaders(response.headers)
    });
};
