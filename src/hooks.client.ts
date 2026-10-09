import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import type { HandleClientError } from '@sveltejs/kit/hooks';
import { logAPI } from '@lib/loggers';
import '@lib/prelude-math';
import { IS_MOCK, createAppError, describeError, errorPageUrl } from '@lib/utils';

const ERROR_PATH = resolve('/error');

let redirectingToError = false;

/// `resolve` already carries any configured `base`; only a trailing slash could differ.
const isOnErrorPage = (): boolean => window.location.pathname.replace(/\/+$/, '') === ERROR_PATH.replace(/\/+$/, '');

/// Last resort for a failure no `<svelte:boundary>` caught: show the error page rather than leave a
/// half-rendered app behind.
function redirectToErrorPage(errorDetail: string): void {
    if (redirectingToError || isOnErrorPage()) {
        return;
    }

    redirectingToError = true;
    const returnUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    void goto(errorPageUrl('internal-error', returnUrl), { state: { errorDetail } })
        .catch((e) => logAPI.error('Failed to navigate to the error page', e))
        .finally(() => (redirectingToError = false));
}

window.onerror = (message, _source, _line, _column, error) => {
    logAPI.error('Uncaught client error', error ?? message);
    redirectToErrorPage(error ? describeError(error) : String(message));
    return false;
};

window.onunhandledrejection = (event) => {
    logAPI.error('Unhandled promise rejection', event.reason);
    redirectToErrorPage(describeError(event.reason));
};

// Initialize MSW for mock environment
if (IS_MOCK) {
    await import('@mocks/setup-client');
}

export const handleError: HandleClientError = ({ kind, error }) => {
    // app and framework errors (404, error() helper, ...) keep their defaults
    if (kind !== 'unknown') {
        return;
    }

    logAPI.error('Unhandled client error', error);
    const appError = createAppError(error);
    return { message: appError.message, appError };
};
