import { config } from '@config';
import { logAPI } from '@lib/loggers';
import '@lib/prelude-math';

// Initialize MSW for mock environment
if (config.environment === 'mock') {
    console.info('Starting browser mock worker...');

    const { bypass } = await import('msw');
    const { worker } = await import('@mocks/browser');

    worker.start({
        /*serviceWorker: {
            url: '/mockServiceWorker.js'
        }*/
        onUnhandledRequest(request, print) {
            logAPI.log(`[MSW] unhandled request: ${request.url}`);

            // const passThrough: [string, RegExp][] = [['https://challenges.cloudflare.com/', /.* /]];
            // if (passThrough.some(([host, path]) => request.url.startsWith(host) && path.test(url.pathname))) {
            //     //console.debug(`Passing through ${request.url}`);
            //     return;
            // }

            if (request.url.startsWith(config.webUrl)) {
                return bypass(request);
            }
            if (request.url.startsWith(config.assetUrl)) {
                return bypass(request);
            }

            print.warning();
            throw new Error(`No handler for ${request.url}`);
        }
    });
}
