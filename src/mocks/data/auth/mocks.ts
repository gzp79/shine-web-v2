import { HttpResponse, http } from 'msw';
import { authPages } from '@lib/server/api/authPages';

export const tokenLogin = (success: boolean) =>
    http.get(authPages.tokenLoginUrl(), ({ request }) => {
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

export const defaultExternalLogin = http.get(authPages.externalLoginUrl(':provider'), ({ params, request }) => {
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

export const defaultGuestLogin = http.get(authPages.guestLoginUrl(), ({ request }) => {
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

export const defaultExternalLink = http.get(authPages.externalLinkUrl(':provider'), ({ request }) => {
    const url = new URL(request.url);
    const redirectUrl = url.searchParams.get('redirectUrl') || '/account';

    return new HttpResponse(null, {
        status: 302,
        headers: {
            Location: redirectUrl
        }
    });
});

export const defaultLogout = http.get(authPages.logoutUrl(), ({ request }) => {
    const url = new URL(request.url);
    const redirectUrl = url.searchParams.get('redirectUrl') || '/public/bye';

    return new HttpResponse(null, {
        status: 302,
        headers: {
            Location: redirectUrl
        }
    });
});

export const logoutFailure = http.get(authPages.logoutUrl(), () => {
    return HttpResponse.json({ message: 'Service unavailable' }, { status: 503 });
});
