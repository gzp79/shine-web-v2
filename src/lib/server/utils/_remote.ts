import { getRequestEvent } from '$app/server';

export function getPassThroughHeaders(): Headers {
    const { cookies, request } = getRequestEvent();
    const headers = new Headers();

    const cookie = cookies
        .getAll()
        .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
        .join('; ');
    if (cookie) {
        headers.set('cookie', cookie);
    }

    const userAgent = request.headers.get('user-agent');
    if (userAgent) {
        headers.set('user-agent', userAgent);
    }

    const origin = request.headers.get('origin');
    if (origin) {
        headers.set('origin', origin);
    }

    return headers;
}
