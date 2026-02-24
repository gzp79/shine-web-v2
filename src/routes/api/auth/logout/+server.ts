import { resolve } from '$app/paths';
import { type RequestHandler, redirect } from '@sveltejs/kit';
import { logAPI } from '@lib/loggers';
import { authUrl } from '@lib/server/api/auth';
import { getPassThroughHeaders } from '@lib/server/utils';

export const GET: RequestHandler = async ({ url, fetch, cookies }) => {
    const all = url.searchParams.get('all') === 'true';
    const identityUrl = authUrl.logoutUrl({
        terminateAll: all,
        redirectUrl: '/public/bye'
    });

    logAPI.log(`Logout requested (all=${all}), notifying backend...`);

    const headers = getPassThroughHeaders();

    try {
        const response = await fetch(identityUrl, {
            method: 'GET',
            headers,
            redirect: 'manual'
        });

        if (response.status >= 500) {
            logAPI.error(`Logout upstream error: ${response.status} ${response.statusText}`);
        } else {
            logAPI.log(`Logout backend notification successful: ${response.status}`);
        }
    } catch (err) {
        logAPI.error('Logout proxy error:', err);
    }

    // Always delete cookies regardless of backend response
    cookies.delete('sid', { path: '/' });
    cookies.delete('tid', { path: '/' });
    cookies.delete('eid', { path: '/' });

    logAPI.log('Logout: cookies deleted, redirecting to bye page');

    throw redirect(302, resolve('/public/bye'));
};
