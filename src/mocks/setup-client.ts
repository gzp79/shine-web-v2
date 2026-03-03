import { config } from '@config';
import { bypass } from 'msw';
import { worker } from '@mocks/browser';

// Initialize MSW browser worker for mock environment
console.info('Starting browser mock worker...');

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
