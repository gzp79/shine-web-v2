import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import '@lib/prelude-math';

let redirectingToError = false;

window.onerror = (message, _source, _line, _column, error) => {
    if (redirectingToError || window.location.pathname === resolve('/error')) {
        return false;
    }

    redirectingToError = true;
    const errorDetail = error instanceof Error ? `${error.name}: ${error.message}` : String(message);
    const returnUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const params = new URLSearchParams({ errorType: 'internal-error', returnUrl });
    // eslint-disable-next-line svelte/no-navigation-without-resolve -- the route is resolved before its query string is appended.
    void goto(`${resolve('/error')}?${params}`, { state: { errorDetail } });
    return false;
};

// Initialize MSW for mock environment
if (import.meta.env.VITE_MOCK) {
    await import('@mocks/setup-client');
}

// Optional exports to silence SvelteKit warnings
export const handleError = undefined;
