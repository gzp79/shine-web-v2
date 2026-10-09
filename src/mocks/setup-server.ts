import { config } from '@config';
import { server } from '@mocks/server';

// Initialize MSW server for mock environment
console.info('Starting server mock worker...');

server.listen({
    onUnhandledFrame({ frame, defaults }) {
        if (frame.protocol !== 'http') {
            return defaults.warn();
        }
        const { request } = frame.data as { request: Request };

        //logAPI.log(`[MSW] unhandled request: ${request.url}`);

        // bypass: return without invoking defaults
        if (request.url.startsWith(config.webUrl)) {
            return;
        }
        if (request.url.startsWith(config.assetUrl)) {
            return;
        }

        defaults.warn();
        throw new Error(`No handler for ${request.url}, ${server.listHandlers().join(', ')}`);
    }
});
