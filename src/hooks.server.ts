import { config } from '@config';
import type { Handle, HandleServerError } from '@sveltejs/kit';
import { getLocaleFromRequest } from '@lib/i18n';
import { logAPI } from '@lib/loggers';
import '@lib/prelude-math';
import { getThemeFromRequest } from '@lib/theme';

// Initialize MSW for mock environment
if (import.meta.env.VITE_MOCK) {
    await import('@mocks/setup-server');
}

/// SvelteKit masks any unexpected (non-HttpError) server-side throw as a generic
/// 500 "Internal Error", leaking the real cause only to the server console.
/// This hook is invoked only for those unexpected errors; outside prod we forward
/// the real message (and stack) to the client so it's visible in the UI.
export const handleError: HandleServerError = ({ error, status, message }) => {
    logAPI.error(`Unhandled server error [${status}]`, error);

    if (config.environment === 'prod') {
        return { message };
    }

    const detail =
        error instanceof Error
            ? `${error.message}${error.stack ? `\n${error.stack}` : ''}`
            : typeof error === 'string'
              ? error
              : JSON.stringify(error);

    return { message: `${message}: ${detail}` };
};

export const handle: Handle = async ({ event, resolve }) => {
    event.locals.theme = await getThemeFromRequest(event.cookies, event.request.headers);
    event.locals.locale = await getLocaleFromRequest(event.cookies, event.request.headers);

    const response = await resolve(event);
    response.headers.set('X-Robots-Tag', 'noindex,nofollow,noarchive');
    return response;
};
