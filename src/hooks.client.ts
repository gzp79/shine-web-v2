import { config } from '@config';

if (config.environment === 'mock') {
    console.info('Starting browser mock worker...');

    const { worker } = await import('@mocks/browser');
    const { bypass } = await import('msw');

    await worker.start({
        serviceWorker: {
            url: '/mockServiceWorker.js'
        },
        onUnhandledRequest(request, print) {
            const url = new URL(request.url);

            const passThrough: [string, RegExp][] = [['https://challenges.cloudflare.com/', /.*/]];
            if (passThrough.some(([host, path]) => request.url.startsWith(host) && path.test(url.pathname))) {
                //console.debug(`Passing through ${request.url}`);
                return;
            }

            const proxyToLocal: [string, RegExp][] = [
                [config.webUrl, /^\/node_modules\//],
                [config.webUrl, /^\/.svelte-kit\//],
                [config.webUrl, /^\/src\//],
                [config.webUrl, /^\/@id\/.*/],
                [config.webUrl, /.*\/__data.json.*/],
                [config.webUrl, /^\/favicon.*/]
            ];
            if (proxyToLocal.some(([host, path]) => request.url.startsWith(host) && path.test(url.pathname))) {
                //console.debug(`Bypassing to local server: ${request.url}`);
                return bypass(request);
            }

            print.warning();
            throw new Error(`No handler for ${request.url}`);
        }
    });
}

export {};
