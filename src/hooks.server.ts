import type { Handle, HandleFetch, HandleServerError } from '@sveltejs/kit/hooks';
import { getLocaleFromRequest } from '#lib/i18n';
import { logAPI } from '#lib/loggers';
import '#lib/prelude-math';
import { getThemeFromRequest } from '#lib/theme';
import { IS_MOCK, describeError } from '#lib/utils';

// Initialize MSW for mock environment
if (IS_MOCK) {
    await import('#mocks/setup-server');
}

/// SvelteKit masks any unexpected (non-HttpError) server-side throw as a generic
/// 500 "Internal Error", leaking the real cause only to the server console. This hook is
/// invoked for every error, but only unexpected ones (kind 'unknown') are customized; `describeError` surfaces the underlying cause
/// to the client (withholding sensitive detail in prod on its own).
export const handleError: HandleServerError = ({ kind, error }) => {
    // app and framework errors (404, error() helper, ...) keep their defaults
    if (kind !== 'unknown') {
        return;
    }
    logAPI.error('Unhandled server error [500]', error);
    return { message: `Internal Error: ${describeError(error)}` };
};

const TRACE_ID_HEADER = 'x-trace-id';

/// Remembers the backend's `x-trace-id` so `handle` can return it to the browser. Applies to
/// `event.fetch` only; with several backend calls in one request (retries), the last one wins.
export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
    const response = await fetch(request);
    const traceId = response.headers.get(TRACE_ID_HEADER);
    if (traceId) {
        event.locals.traceId = traceId;
    }
    return response;
};

export const handle: Handle = async ({ event, resolve }) => {
    event.locals.theme = await getThemeFromRequest(event.cookies, event.request.headers);
    event.locals.locale = await getLocaleFromRequest(event.cookies, event.request.headers);

    const response = await resolve(event);
    response.headers.set('X-Robots-Tag', 'noindex,nofollow,noarchive');
    if (event.locals.traceId) {
        response.headers.set(TRACE_ID_HEADER, event.locals.traceId);
    }
    return response;
};
