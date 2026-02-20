import { config } from '@config';
import type { Handle } from '@sveltejs/kit';
import { getLocaleFromRequest } from '@lib/i18n';
import '@lib/prelude-math';
import { getThemeFromRequest } from '@lib/theme';

// Initialize MSW for mock environment
if (config.environment === 'mock') {
    console.info('Starting server mock worker...');
    const { bypass } = await import('msw');
    const { server } = await import('@mocks/server');

    server.listen({
        onUnhandledRequest(request, print) {
            //logAPI.log(`[MSW] unhandled request: ${request.url}`);

            if (request.url.startsWith(config.webUrl)) {
                return bypass(request);
            }
            if (request.url.startsWith(config.assetUrl)) {
                return bypass(request);
            }

            print.warning();
            throw new Error(`No handler for ${request.url}, ${server.listHandlers().join(', ')}`);
        }
    });
}

export const handle: Handle = async ({ event, resolve }) => {
    event.locals.theme = await getThemeFromRequest(event.cookies, event.request.headers);
    event.locals.locale = await getLocaleFromRequest(event.cookies, event.request.headers);

    return resolve(event);
};
