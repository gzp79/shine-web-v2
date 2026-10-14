import { resolve } from '$app/paths';
import { IS_PROD } from './_env';
import { toQueryString } from './_url';

/// Whether errors may carry their full, potentially sensitive detail: response bodies, request URLs,
/// stack traces and arbitrary thrown payloads.
export const VERBOSE_ERRORS = !IS_PROD;

export const errorList = [
    'auth-login-required',
    'auth-input-error',
    'auth-error',
    'auth-internal-error',
    'auth-token-expired',
    'auth-session-expired',
    'auth-register-email-conflict',
    'auth-register-external-id-conflict',
    'auth-not-confirmed',
    'auth-email-login',
    'external-missing-cookie',
    'external-invalid-nonce',
    'external-invalid-csrf',
    'external-exchange-failed',
    'external-info-failed',
    'external-discovery-failed',
    'server-down',
    'internal-error'
] as const;
export type ErrorType = (typeof errorList)[number];

/// The canonical `/error` page URL
export function errorPageUrl(errorType: ErrorType, returnUrl?: string | null): string {
    return resolve('/error') + toQueryString({ errorType, returnUrl });
}

/// Why the login page is being shown; selects the message it greets the user with.
export const loginHintList = ['login-expired', 'email-confirm', 'email-change'] as const;
export type LoginHint = (typeof loginHintList)[number];

export type LoginPageParams = {
    /// Where to send the user once they are authenticated. Must already be sanitized.
    returnUrl?: string | null;
    /// Explains why they ended up here, e.g. `login-expired` for an expired session.
    hint?: LoginHint;
    /// Skip the silent remember-me attempt and ask for credentials straight away.
    prompt?: boolean;
    errorType?: ErrorType;
};

/// The canonical `/login` URL — the single place that page's query contract is written.
export function loginPageUrl({ returnUrl, hint, prompt, errorType }: LoginPageParams = {}): string {
    return resolve('/login') + toQueryString({ returnUrl, hint, prompt: prompt ? 'true' : undefined, errorType });
}

const appErrorKindList = ['fetch', 'other', 'retryLimit'] as const;
export type AppErrorKind = (typeof appErrorKindList)[number];

export type BaseAppError = {
    type: 'app-error';
    kind: AppErrorKind;
    message: string;
    shouldRetry?: boolean;
};

export type FetchError = BaseAppError & {
    kind: 'fetch';
    details?: { status?: number; body?: string; url?: string };
};

export type OtherError = BaseAppError & {
    kind: 'other';
    details?: unknown;
};

export type RetryLimitError = BaseAppError & {
    kind: 'retryLimit';
    details?: {
        retryCount: number;
        lastError?: unknown;
    };
};

export type AppError = FetchError | RetryLimitError | OtherError;

export const isAppError = (value: unknown): value is AppError => {
    if (!value || typeof value !== 'object') {
        return false;
    }
    const v = value as Record<string, unknown>;
    return v.type === 'app-error' && appErrorKindList.includes(v.kind as AppErrorKind);
};

const MAX_BODY_LENGTH = 200;

const truncate = (text: string): string | undefined => {
    const trimmed = text.trim();
    if (!trimmed) return undefined;
    return trimmed.length > MAX_BODY_LENGTH ? `${trimmed.slice(0, MAX_BODY_LENGTH)}…` : trimmed;
};

/// Readable detail from an error response. Only structured (JSON) or plain-text bodies carry a usable
/// message; HTML error pages and binary payloads are dropped rather than parsed.
async function readErrorBody(response: Response): Promise<string | undefined> {
    const contentType = response.headers.get('content-type') ?? '';
    try {
        if (contentType.includes('json')) {
            const data: unknown = await response.clone().json();
            if (typeof data === 'string') return truncate(data);
            if (data && typeof data === 'object') {
                const { message, error, detail } = data as Record<string, unknown>;
                for (const candidate of [message, error, detail]) {
                    if (typeof candidate === 'string') return truncate(candidate);
                }
            }
            return undefined;
        }
        if (contentType.startsWith('text/plain')) {
            return truncate(await response.clone().text());
        }
    } catch {
        return undefined;
    }
    return undefined;
}

export async function createFetchError(response: Response, message = `HTTP ${response.status}`): Promise<FetchError> {
    const body = VERBOSE_ERRORS ? await readErrorBody(response) : undefined;

    return {
        type: 'app-error',
        kind: 'fetch',
        message,
        shouldRetry: response.status >= 500 || response.status === 429,
        details: { status: response.status, body, url: VERBOSE_ERRORS ? response.url : undefined }
    };
}

export function createOtherError(message: string, details?: unknown): OtherError {
    return {
        type: 'app-error',
        kind: 'other',
        message,
        details
    };
}

export function createRetryLimitError(retryCount: number, lastError?: unknown): RetryLimitError {
    return {
        type: 'app-error',
        kind: 'retryLimit',
        message: 'Retry limit exceeded',
        details: {
            retryCount,
            lastError
        }
    };
}

/// Structural match for SvelteKit's `HttpError`.
///
/// Why not use SvelteKit's `isHttpError()`: it tests `instanceof`, which fails once an error has
/// been serialized and rebuilt — as happens to a remote-function error on its way to the client.
/// Checking the fields instead matches both the original object and the rebuilt copy.
///
/// `body` is the `App.Error` produced by the server, so it may still hold the original `AppError`.
type HttpErrorShape = {
    status: number;
    body?: { message?: string; appError?: unknown };
    message?: string;
};

function isHttpErrorShape(value: unknown): value is HttpErrorShape {
    if (!value || typeof value !== 'object' || value instanceof Error) return false;
    const v = value as Record<string, unknown>;
    if (typeof v.status !== 'number') return false;
    return (typeof v.body === 'object' && v.body !== null) || typeof v.message === 'string';
}

/// Recovers an `HttpError` that some intermediate code turned into a string.
///
/// How it gets stringified:
/// 1. `HttpError` does not extend `Error`, and its `toString()` returns `JSON.stringify(body)`
///    (`@sveltejs/kit/src/exports/internal/shared.js`).
/// 2. SvelteKit's Node response bridging does `error instanceof Error ? error : new Error(String(error))`
///    (`@sveltejs/kit/src/exports/node/index.js`).
/// 3. So the error reaches us as `new Error('{"status":500,"message":"..."}')`.
///
/// Only that one path does this — production runs on adapter-cloudflare — but it is the dev path,
/// where these messages are read the most.
function parseSerializedError(text: string): { message?: string; appError?: unknown } | undefined {
    if (!text.startsWith('{')) return undefined;
    try {
        const parsed: unknown = JSON.parse(text);
        if (parsed && typeof parsed === 'object') {
            return parsed as { message?: string; appError?: unknown };
        }
    } catch {
        return undefined;
    }
    return undefined;
}

export function createAppError(error: unknown): AppError {
    if (isAppError(error)) {
        return error;
    }

    if (typeof error === 'object' && error !== null && 'appError' in error && isAppError(error.appError)) {
        return error.appError;
    }

    // HttpError carries a meaningful, server-provided message (e.g. thrown via `error(status, msg)`).
    // Matched by shape, which covers the live object and a serialized copy alike.
    if (isHttpErrorShape(error)) {
        if (isAppError(error.body?.appError)) {
            return error.body.appError;
        }
        return {
            type: 'app-error',
            kind: 'fetch',
            message: error.body?.message ?? error.message ?? `HTTP ${error.status}`,
            details: { status: error.status }
        };
    }

    if (error instanceof Error) {
        const parsed = parseSerializedError(error.message);
        if (isAppError(parsed?.appError)) {
            return parsed.appError;
        }
        return createOtherError(
            typeof parsed?.message === 'string' ? parsed.message : error.message,
            VERBOSE_ERRORS ? { name: error.name, stack: error.stack } : undefined
        );
    }

    if (typeof error === 'string') {
        const parsed = parseSerializedError(error);
        if (isAppError(parsed?.appError)) {
            return parsed.appError;
        }
        return createOtherError(typeof parsed?.message === 'string' ? parsed.message : error);
    }

    return createOtherError('Unknown error', VERBOSE_ERRORS ? error : undefined);
}

/**
 * A human-readable description of an error's underlying cause, safe to surface to the client.
 * Unwraps retry wrappers (so the real failure shows, not just "Retry limit exceeded") and adds the
 * upstream HTTP status for fetch failures. Potentially sensitive detail — response bodies, raw
 * stack traces and arbitrary thrown payloads — is only included when `VERBOSE_ERRORS` is set.
 */
export function describeError(error: unknown): string {
    if (isAppError(error)) {
        if (error.kind === 'retryLimit') {
            const { retryCount, lastError } = error.details ?? {};
            const attempts = retryCount ? `after ${retryCount} ${retryCount === 1 ? 'retry' : 'retries'}: ` : '';
            return `${attempts}${lastError !== undefined ? describeError(lastError) : error.message}`;
        }
        if (error.kind === 'fetch') {
            const { status, body, url } = error.details ?? {};
            const suffix = status !== undefined ? ` (HTTP ${status})` : '';
            const where = VERBOSE_ERRORS && url ? ` at ${url}` : '';
            const detail = VERBOSE_ERRORS && body ? `: ${body}` : '';
            return `${error.message}${suffix}${where}${detail}`;
        }
        return error.message;
    }

    // Non-app errors may carry internal detail (stack traces, arbitrary payloads); withhold it in prod.
    if (!VERBOSE_ERRORS) return 'Unexpected error';

    if (error instanceof Error) return `${error.message}${error.stack ? `\n${error.stack}` : ''}`;
    if (typeof error === 'string') return error;
    try {
        return JSON.stringify(error);
    } catch {
        return String(error);
    }
}
