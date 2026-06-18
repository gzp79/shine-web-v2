import '@lib/prelude-math';

// Initialize MSW for mock environment
if (import.meta.env.VITE_MOCK) {
    await import('@mocks/setup-client');
}

// Optional exports to silence SvelteKit warnings
export const handleError = undefined;
export const init = undefined;
