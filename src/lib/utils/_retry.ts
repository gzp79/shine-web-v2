import { logAPI } from '@lib/loggers';
import { type AppError, async, createOtherError, createRetryLimitError, isAppError } from '@lib/utils';

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

/// Retries the provided async function with exponential backoff.
/// The default backoff configuration result in an approximate total of 11.5s delay before giving up.
export async function retryWithBackoff<T>(
    fn: (retry: RetryObject) => Promise<T>,
    maxRetries = 4,
    baseDelay = 350
): Promise<T> {
    let attempt = 0;

    for (;;) {
        try {
            return await fn(createRetryObject(attempt, maxRetries));
        } catch (error) {
            const shouldRetry = isRetryError(error) || (isAppError(error) && error.shouldRetry);
            if (shouldRetry) {
                if (attempt >= maxRetries) {
                    const innerError = isRetryError(error) ? error.innerError : error;
                    logAPI.error('Retry limit exceeded in retryWithBackoff with a last error:', innerError);
                    const err = createRetryLimitError(maxRetries, innerError);
                    throw err;
                }

                const timeout = baseDelay * Math.pow(2, attempt);
                const jitter = Math.random() * 0.1 * timeout;
                await async.delay(timeout + jitter);
                attempt++;
            } else {
                logAPI.error('Encountered an error that cannot be retried.', error);
                throw error;
            }
        }
    }
}

export async function fallibleRetryWithBackoff<T>(
    fn: (retry: RetryObject) => Promise<T>,
    maxRetries = 3,
    baseDelay = 100
): Promise<T | AppError> {
    try {
        return await retryWithBackoff<T>(fn, maxRetries, baseDelay);
    } catch (error) {
        return isAppError(error) ? error : createOtherError('Unknown error', error);
    }
}
