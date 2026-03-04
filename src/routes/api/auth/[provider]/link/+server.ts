import { resolve } from '$app/paths';
import { error, redirect } from '@sveltejs/kit';
import { logAPI } from '@lib/loggers';
import { authPages } from '@lib/server/api/authPages';
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

    const identityUrl = authPages.externalLinkUrl(provider, {
        redirectUrl: sanitizedReturnUrl(url.searchParams.get('redirectUrl'))
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
        logAPI.error('Link proxy error:', err);
        throw redirect(302, resolve('/error') + '?errorType=server-down');
    }

    validateProxyResponse(response);

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: filterIncompatibleHeaders(response.headers)
    });
};
