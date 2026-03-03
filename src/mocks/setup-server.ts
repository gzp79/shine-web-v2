import { config } from '@config';
import { bypass } from 'msw';
import { server } from '@mocks/server';

// Initialize MSW server for mock environment
console.info('Starting server mock worker...');

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
