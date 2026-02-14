import { HttpResponse, http } from 'msw';
import { authUrl } from '@lib/server/api/auth';

export const defaultExternalLogin = http.get(authUrl.externalLoginUrl(':provider'), ({ params, request }) => {
    const provider = params.provider;
    const url = new URL(request.url);
    const redirectUrl = url.searchParams.get('redirectUrl') || '/game';

    console.log(`[MSW] Mock login for provider: ${provider}`);
    console.log(`[MSW] User-Agent: ${request.headers.get('user-agent')}`);
    console.log(`[MSW] Redirecting to: ${redirectUrl}`);

    return new HttpResponse(null, {
        status: 302,
        headers: {
            'Set-Cookie': [
                `sid=mock-token-${provider}-${Date.now()}; Path=/; HttpOnly; Secure; SameSite=Strict` //
            ].join(', '),
            Location: redirectUrl
        }
    });
});

export const defaultGuestLogin = http.get(authUrl.guestLoginUrl(), ({ request }) => {
    const url = new URL(request.url);
    const redirectUrl = url.searchParams.get('redirectUrl') || '/game';

    console.log('[MSW] Mock guest login');
    console.log(`[MSW] User-Agent: ${request.headers.get('user-agent')}`);
    console.log(`[MSW] Redirecting to: ${redirectUrl}`);

    return new HttpResponse(null, {
        status: 302,
        headers: {
            'Set-Cookie': [
                `sid=mock-token-guest-${Date.now()}; Path=/; HttpOnly; Secure; SameSite=Strict` //
            ].join(', '),
            Location: redirectUrl
        }
    });
});
