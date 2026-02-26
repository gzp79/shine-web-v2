import { resolve } from '$app/paths';
import { redirect } from '@sveltejs/kit';
import { logAPI } from '@lib/loggers';
import { authUrl } from '@lib/server/api/auth';
import { getPassThroughHeaders, sanitizedReturnUrl, validateProxyResponse } from '@lib/server/utils';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, fetch, cookies }) => {
    const formData = await request.formData();

    const email = formData.get('email')?.toString() || '';
    const rememberMe = formData.get('rememberMe') === 'true';
    const captcha = formData.get('captcha')?.toString() || '';
    const redirectUrl = sanitizedReturnUrl(formData.get('redirectUrl')?.toString());

    const identityUrl = authUrl.emailLoginUrl({
        email,
        rememberMe,
        captcha,
        redirectUrl
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
        logAPI.error('Email auth proxy error:', err);
        throw redirect(302, resolve('/error') + '?errorType=server-down');
    }

    validateProxyResponse(response);

    // Clear session cookies
    cookies.delete('sid', { path: '/' });
    cookies.delete('tid', { path: '/' });
    cookies.delete('eid', { path: '/' });

    // Redirect based on response status
    if (response.ok || (response.status >= 300 && response.status < 400)) {
        throw redirect(303, resolve('/public/email-login'));
    } else {
        throw redirect(303, resolve('/error') + '?errorType=auth-failed');
    }
};
