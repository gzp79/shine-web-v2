import { resolve } from '$app/paths';
import { getRequestEvent } from '$app/server';
import { redirect } from '@sveltejs/kit';
import { logAPI } from '@lib/loggers';

export function getMockWorkerHeader(): Headers {
    const headers = new Headers();
    if (import.meta.env.VITE_MOCK) {
        const { request } = getRequestEvent();
        const worker = request.headers.get('x-mock-worker');
        if (worker) {
            headers.set('x-mock-worker', worker);
        }
    }
    return headers;
}

export function getPassThroughHeaders(): Headers {
    const { cookies, request } = getRequestEvent();
    const headers = new Headers();

    // Mock env only: forward the Playwright worker id so MSW can route the
    // outbound fetch to that worker's overrides. Never sent to real backends.
    if (import.meta.env.VITE_MOCK) {
        const worker = request.headers.get('x-mock-worker');
        if (worker) {
            headers.set('x-mock-worker', worker);
        }
    }

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

/// Checks if the current request is using HTTP/2.
function isHttp2Request(): boolean {
    try {
        const event = getRequestEvent();
        // @ts-expect-error - Accessing Node.js-specific platform property
        const nodeReq = event.platform?.req || event.request?.raw;
        if (nodeReq && typeof nodeReq.httpVersion === 'string') {
            return nodeReq.httpVersion.startsWith('2');
        }
    } catch {
        // If we can't determine, assume HTTP/2 (safer to filter)
        logAPI.warn('Unable to determine HTTP version, defaulting to HTTP/2 for header filtering');
    }
    return true;
}

/// Filters out headers that cause issues when proxying responses.
export function filterIncompatibleHeaders(headers: Headers): Headers {
    const filtered = new Headers();
    const forbiddenHeaders = [
        // HTTP/1 connection headers (forbidden in HTTP/2)
        'connection',
        'keep-alive',
        'transfer-encoding',
        'upgrade',
        'proxy-connection',
        // Content encoding headers (fetch auto-decodes, so we must not pass these through)
        'content-encoding',
        'content-length' // Will be wrong after decoding
    ];

    // Only filter HTTP/2 connection headers if we're responding over HTTP/2
    const shouldFilterHttp2Headers = isHttp2Request();

    for (const [key, value] of headers.entries()) {
        const keyLower = key.toLowerCase();

        // Always filter content-encoding/length (fetch auto-decodes)
        if (keyLower === 'content-encoding' || keyLower === 'content-length') {
            continue;
        }

        // Filter HTTP/2 incompatible headers only when needed
        if (shouldFilterHttp2Headers && forbiddenHeaders.includes(keyLower)) {
            continue;
        }

        filtered.append(key, value);
    }

    return filtered;
}

/// Validates proxy responses and throws 502 error for upstream 5xx responses.
export function validateProxyResponse(response: Response): void {
    if (response.status >= 500) {
        logAPI.error(
            `Upstream server error [${response.url.split('?')[0]}]: ${response.status} ${response.statusText}`
        );
        throw redirect(302, resolve('/error') + '?errorType=server-down');
    }
}

export function sanitizedReturnUrl(rawUrl: string | null | undefined): string | null {
    if (rawUrl) {
        try {
            // Try to parse as a relative URL against a dummy base to ensure it's well-formed
            const parsed = new URL(rawUrl, 'http://localhost');
            if (parsed.origin === 'http://localhost' && rawUrl.startsWith('/')) {
                const sanitized = parsed.pathname + parsed.search + parsed.hash;
                logAPI.info('Sanitized return URL:', sanitized);
                return sanitized;
            }
        } catch (e) {
            logAPI.error(`Failed to parse return URL (${rawUrl}):`, e);
        }
    }
    return null;
}
