import { config } from '@config';
import { worker } from '@mocks/browser';

// Initialize MSW browser worker for mock environment
console.info('Starting browser mock worker...');

worker.start({
    /*serviceWorker: {
        url: '/mockServiceWorker.js'
    }*/
    onUnhandledFrame({ frame, defaults }) {
        if (frame.protocol !== 'http') {
            return defaults.warn();
        }
        const { request } = frame.data as { request: Request };

        // bypass: return without invoking defaults
        if (request.url.startsWith('https://challenges.cloudflare.com/')) {
            return;
        }

        if (request.url.startsWith(config.webUrl)) {
            return;
        }
        if (request.url.startsWith(config.assetUrl)) {
            return;
        }

        defaults.warn();
        throw new Error(`No handler for ${request.url}`);
    }
});
