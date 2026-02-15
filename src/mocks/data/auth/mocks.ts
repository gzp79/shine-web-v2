import { HttpResponse, http } from 'msw';
import { authUrl } from '@lib/server/api/auth';

export const tokenLogin = (success: boolean) =>
    http.get(authUrl.tokenLoginUrl(), ({ request }) => {
        const url = new URL(request.url);
        const redirectUrl = url.searchParams.get('redirectUrl') || '/game';
        const errorUrl = url.searchParams.get('errorUrl') || '/error';

        return new HttpResponse(null, {
            status: 302,
            headers: {
                Location: success ? redirectUrl : errorUrl
            }
        });
    });

export const defaultExternalLogin = http.get(authUrl.externalLoginUrl(':provider'), ({ params, request }) => {
    const provider = params.provider;
    const url = new URL(request.url);
    const redirectUrl = url.searchParams.get('redirectUrl') || '/game';

    return new HttpResponse(null, {
        status: 302,
        headers: {
            'Set-Cookie': [
                `sid=mock-token-${provider}-${Date.now()}; Domain=scytta.com; Path=/; HttpOnly; Secure; SameSite=Lax` //
            ].join(', '),
            Location: redirectUrl
        }
    });
});

export const defaultGuestLogin = http.get(authUrl.guestLoginUrl(), ({ request }) => {
    const url = new URL(request.url);
    const redirectUrl = url.searchParams.get('redirectUrl') || '/game';

    return new HttpResponse(null, {
        status: 302,
        headers: {
            'Set-Cookie': [
                `sid=mock-token-guest-${Date.now()}; Domain=scytta.com; Path=/; HttpOnly; Secure; SameSite=Lax` //
            ].join(', '),
            Location: redirectUrl
        }
    });
});
