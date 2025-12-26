export type AppErrorKind = 'fetch' | 'other' | 'retryLimit';

export type BaseAppError = {
    type: 'app-error';
    kind: AppErrorKind;
    message: string;
    details?: unknown;
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
    return v.type === 'app-error' && (v.kind === 'fetch' || v.kind === 'other');
};

export async function createFetchError(response: Response, message = `HTTP ${response.status}`): Promise<FetchError> {
    let body: string | undefined;
    try {
        body = await response.clone().text();
    } catch {
        body = undefined;
    }

    return {
        type: 'app-error',
        kind: 'fetch',
        message,
        details: { status: response.status, body }
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
