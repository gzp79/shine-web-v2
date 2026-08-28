import type { Handle, HandleServerError } from '@sveltejs/kit';
import { getLocaleFromRequest } from '@lib/i18n';
import { logAPI } from '@lib/loggers';
import '@lib/prelude-math';
import { getThemeFromRequest } from '@lib/theme';
import { describeError } from '@lib/utils';

// Initialize MSW for mock environment
if (import.meta.env.VITE_MOCK) {
    await import('@mocks/setup-server');
}

/// SvelteKit masks any unexpected (non-HttpError) server-side throw as a generic
/// 500 "Internal Error", leaking the real cause only to the server console. This hook is
/// invoked only for those unexpected errors; `describeError` surfaces the underlying cause
/// to the client (withholding sensitive detail in prod on its own).
export const handleError: HandleServerError = ({ error, status, message }) => {
    logAPI.error(`Unhandled server error [${status}]`, error);
    return { message: `${message}: ${describeError(error)}` };
};

export const handle: Handle = async ({ event, resolve }) => {
    event.locals.theme = await getThemeFromRequest(event.cookies, event.request.headers);
    event.locals.locale = await getLocaleFromRequest(event.cookies, event.request.headers);

    const response = await resolve(event);
    response.headers.set('X-Robots-Tag', 'noindex,nofollow,noarchive');
    return response;
};
