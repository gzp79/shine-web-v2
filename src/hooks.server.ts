import { config } from '@config';
import { logAPI } from '@lib/loggers';
import '@lib/prelude-math';

if (config.environment === 'mock') {
    console.info('Starting server mock worker...');

    const { server } = await import('@mocks/server');
    const { bypass } = await import('msw');

    server.listen({
        onUnhandledRequest(request, print) {
            const url = new URL(request.url);

            logAPI.log(`[MSW] unhandled request: ${request.url}`);

            const passThrough: [string, RegExp][] = [
                //['https://echo.free.beeceptor.com', /.*/]
            ];
            if (passThrough.some(([host, path]) => request.url.startsWith(host) && path.test(url.pathname))) {
                logAPI.log(`[MSW] Passing through ${request.url}`);
                return;
            }

            const proxyToLocal: [string, RegExp][] = [[config.assetUrl, /^\/assets\//]];
            if (proxyToLocal.some(([host, path]) => request.url.startsWith(host) && path.test(url.pathname))) {
                logAPI.log(`[MSW] Proxy to local ${request.url}`);
                return bypass(request);
            }

            print.warning();
            throw new Error(`No handler for ${request.url}`);
        }
    });
}

export {};
