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
    const returnUrl = url.searchParams.get('returnUrl');

    const redirectUrl = sanitizedReturnUrl(returnUrl);
    const errorUrl = `/login?${new URLSearchParams({
        ...(returnUrl ? { returnUrl } : {}),
        prompt: 'true'
    })}`;

    const identityUrl = authUrl.tokenLoginUrl({ redirectUrl, errorUrl });
    const headers = getPassThroughHeaders();

    let response;
    try {
        logAPI.log('Proxying token login request to identity server:', identityUrl);
        response = await fetch(identityUrl, {
            method: 'GET',
            headers,
            redirect: 'manual'
        });
    } catch (err) {
        logAPI.error('Token auth proxy error:', err);
        throw redirect(302, resolve('/error') + '?errorType=server-down');
    }

    validateProxyResponse(response);

    logAPI.log(`Received response from identity server: ${response.status} ${response.statusText}`);
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: filterIncompatibleHeaders(response.headers)
    });
};
