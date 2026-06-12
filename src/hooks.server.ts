import { config } from '@config';
import type { Handle } from '@sveltejs/kit';
import { getLocaleFromRequest } from '@lib/i18n';
import '@lib/prelude-math';
import { getThemeFromRequest } from '@lib/theme';

// Initialize MSW for mock environment
if (config.environment === 'mock') {
    await import('@mocks/setup-server');
}

export const handle: Handle = async ({ event, resolve }) => {
    event.locals.theme = await getThemeFromRequest(event.cookies, event.request.headers);
    event.locals.locale = await getLocaleFromRequest(event.cookies, event.request.headers);

    const response = await resolve(event);
    response.headers.set('X-Robots-Tag', 'noindex,nofollow,noarchive');
    return response;
};
