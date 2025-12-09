// hooks.server.ts
import { config } from '@config';
import type { Handle } from '@sveltejs/kit';
import { loadThemeServerSide } from '@lib/theme/theme.svelte';

if (config.environment === 'mock') {
    console.info('Starting server mock worker...');
    const { server } = await import('@mocks/node');
    server.listen({
        onUnhandledRequest(request, print) {
            const url = new URL(request.url);

            const passThrough: [string, RegExp][] = [];
            if (passThrough.some(([host, path]) => request.url.startsWith(host) && path.test(url.pathname))) {
                console.debug(`Passing through ${request.url}`);
                return;
            }

            const proxyToLocal: [string, RegExp][] = [[config.assetUrl, /^\/assets\//]];
            if (proxyToLocal.some(([host, path]) => request.url.startsWith(host) && path.test(url.pathname))) {
                console.debug(`Proxy to local ${request.url}`);
                throw new Error('Proxy to local is not implemented');
                return;
            }

            print.warning();
            throw new Error(`No handler for ${request.url}`);
        }
    });
}

export const handle: Handle = async ({ event, resolve }) => {
    const theme = await loadThemeServerSide(event.cookies);

    event.locals.theme = theme;

    const response = await resolve(event, {
        transformPageChunk: ({ html }) => {
            const themeAttribute = theme.theme === 'system' ? '' : `data-theme=${event.locals.theme.theme}`;
            return html.replace('%svelte:data-theme%', themeAttribute);
        }
    });

    return response;
};
