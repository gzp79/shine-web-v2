import { config } from '@config';
import '@lib/prelude-math';

// Initialize MSW for mock environment
if (config.environment === 'mock') {
    await import('@mocks/setup-client');
}

// Optional exports to silence SvelteKit warnings
export const handleError = undefined;
export const init = undefined;
