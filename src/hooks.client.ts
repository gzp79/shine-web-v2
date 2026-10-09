import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import type { HandleClientError } from '@sveltejs/kit/hooks';
import '@lib/prelude-math';
import { IS_MOCK, errorPageUrl, isAppError } from '@lib/utils';

let redirectingToError = false;

window.onerror = (message, _source, _line, _column, error) => {
    if (redirectingToError || window.location.pathname === resolve('/error')) {
        return false;
    }

    redirectingToError = true;
    const errorDetail = error instanceof Error ? `${error.name}: ${error.message}` : String(message);
    const returnUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    void goto(errorPageUrl('internal-error', returnUrl), { state: { errorDetail } });
    return false;
};

// Initialize MSW for mock environment
if (IS_MOCK) {
    await import('@mocks/setup-client');
}

// SvelteKit passes errors caught by `<svelte:boundary>` through this hook; keep our AppError intact
// so the boundary's `failed` snippet can still render its message and details.
export const handleError: HandleClientError = ({ kind, error }) => {
    if (kind === 'unknown' && isAppError(error)) {
        return { message: error.message, appError: error };
    }
};
