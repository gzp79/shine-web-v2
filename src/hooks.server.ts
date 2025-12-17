import { config } from '@config';

if (config.environment === 'mock') {
    console.info('Starting server mock worker...');

    const { server } = await import('@mocks/node');
    const { bypass } = await import('msw');

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
                return bypass(request);
            }

            print.warning();
            throw new Error(`No handler for ${request.url}`);
        }
    });
}

export {};
