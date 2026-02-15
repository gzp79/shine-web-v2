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

export function sanitizedReturnUrl(rawUrl: string | null | undefined): string {
    console.log('Raw return URL:', rawUrl);
    if (rawUrl) {
        try {
            const parsed = new URL(rawUrl, 'http://localhost');
            if (parsed.origin === 'http://localhost' && rawUrl.startsWith('/')) {
                const sanitized = parsed.pathname + parsed.search + parsed.hash;
                console.info('Sanitized return URL:', sanitized);
                return sanitized;
            }
        } catch (e) {
            console.error(`Failed to parse return URL (${rawUrl}):`, e);
        }
    }
    console.info('Returning default /game URL');
    return '/game';
}
