import { async, createRetryLimitError } from '@lib/utils';

type RetryError = { __retry: true; innerError?: unknown };

function isRetryError(value: unknown): value is RetryError {
    return typeof value === 'object' && value !== null && '__retry' in value;
}

export type RetryObject = {
    limit: number;
    current: number;
    (innerError?: unknown): never;
};

function createRetryObject(attempt: number, maxRetries: number): RetryObject {
    const retry = ((innerError?: unknown): never => {
        throw { __retry: true, innerError } as RetryError;
    }) as RetryObject;

    retry.limit = maxRetries;
    retry.current = attempt;

    return retry;
}

export async function retryWithBackoff<T>(
    fn: (retry: RetryObject) => Promise<T>,
    maxRetries = 3,
    baseDelay = 100
): Promise<T> {
    let attempt = 0;

    for (;;) {
        try {
            return await fn(createRetryObject(attempt, maxRetries));
        } catch (error) {
            if (isRetryError(error)) {
                if (attempt >= maxRetries) {
                    throw createRetryLimitError(maxRetries, error.innerError);
                }

                attempt++;
                const timeout = baseDelay * Math.pow(2, attempt);
                const jitter = Math.random() * 0.1 * timeout;
                await async.delay(timeout + jitter);
            } else {
                throw error;
            }
        }
    }
}
