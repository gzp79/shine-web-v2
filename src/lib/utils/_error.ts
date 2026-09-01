import { dev } from '$app/environment';
import { isHttpError } from '@sveltejs/kit';

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

const appErrorKindList = ['fetch', 'other', 'retryLimit'] as const;
export type AppErrorKind = (typeof appErrorKindList)[number];

export type BaseAppError = {
    type: 'app-error';
    kind: AppErrorKind;
    message: string;
    details?: unknown;
    shouldRetry?: boolean;
};

export type FetchError = BaseAppError & {
    kind: 'fetch';
    details?: { status?: number; body?: string } | unknown;
};

export type OtherError = BaseAppError & {
    kind: 'other';
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

export async function createFetchError(response: Response, message = `HTTP ${response.status}`): Promise<FetchError> {
    let body: string | undefined;
    if (dev) {
        try {
            body = await response.clone().text();
        } catch {
            body = undefined;
        }
    }

    return {
        type: 'app-error',
        kind: 'fetch',
        message,
        shouldRetry: response.status >= 500 || response.status === 429,
        details: { status: response.status, body }
    };
}

export function createOtherError(message: string, details?: unknown): OtherError {
    return {
        type: 'app-error',
        kind: 'other',
        message: message ?? 'Other error',
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

export function createAppError(error: unknown): AppError {
    if (isAppError(error)) {
        return error;
    }

    // HttpError carries a meaningful, server-provided message (e.g. thrown via `error(status, msg)`).
    if (isHttpError(error)) {
        return {
            type: 'app-error',
            kind: 'fetch',
            message: error.body?.message ?? `HTTP ${error.status}`,
            details: { status: error.status }
        };
    }

    if (error instanceof Error) {
        return createOtherError(error.message, dev ? { name: error.name, stack: error.stack } : undefined);
    }

    return createOtherError('Unknown error', dev ? error : undefined);
}

/**
 * A human-readable description of an error's underlying cause, safe to surface to the client.
 * Unwraps retry wrappers (so the real failure shows, not just "Retry limit exceeded") and adds the
 * upstream HTTP status for fetch failures. Potentially sensitive detail — response bodies, raw
 * stack traces and arbitrary thrown payloads — is only included outside production.
 */
export function describeError(error: unknown): string {
    if (isAppError(error)) {
        if (error.kind === 'retryLimit') {
            const { retryCount, lastError } = (error.details ?? {}) as RetryLimitError['details'] & object;
            const attempts = retryCount ? `after ${retryCount} ${retryCount === 1 ? 'retry' : 'retries'}: ` : '';
            return `${attempts}${lastError !== undefined ? describeError(lastError) : error.message}`;
        }
        if (error.kind === 'fetch') {
            const { status, body } = (error.details ?? {}) as { status?: number; body?: string };
            const suffix = status !== undefined ? ` (HTTP ${status})` : '';
            return `${error.message}${suffix}${!import.meta.env.VITE_PROD && body ? ` ${body}` : ''}`;
        }
        return error.message;
    }

    // Non-app errors may carry internal detail (stack traces, arbitrary payloads); withhold it in prod.
    if (import.meta.env.VITE_PROD) return 'Unexpected error';

    if (error instanceof Error) return `${error.message}${error.stack ? `\n${error.stack}` : ''}`;
    if (typeof error === 'string') return error;
    try {
        return JSON.stringify(error);
    } catch {
        return String(error);
    }
}

export function formatError(error: unknown): string {
    if (isAppError(error)) {
        const details = error.details ? ` - ${JSON.stringify(error.details)}` : '';
        return `${error.kind} error: ${error.message}${details}`;
    }

    if (error instanceof Error) return error.message;
    try {
        return JSON.stringify(error);
    } catch {
        return String(error);
    }
}
