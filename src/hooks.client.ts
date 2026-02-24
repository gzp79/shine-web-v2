import { config } from '@config';
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
            if (request.url.startsWith('https://challenges.cloudflare.com/')) {
                return bypass(request);
            }

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
