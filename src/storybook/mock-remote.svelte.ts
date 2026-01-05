import { type AppError, type QueryLike, async, createAppError, isAppError } from '@lib/utils';

function createAwaited<T>(
    promise: Promise<T>,
    loading: boolean,
    current: T | undefined,
    error: AppError | undefined = undefined
): QueryLike<T> {
    const result = promise as QueryLike<T>;

    result.loading = loading;
    result.current = current;
    result.error = error;
    result.refresh = async () => {};

    return result;
}

/// Emulate a simplified version of the RemoteQuery.
function createFromAsync<T>(asyncFn: () => Promise<T>, delayMs: number): QueryLike<T> {
    let loading = $state(true);
    let current = $state<T | undefined>(undefined);
    let error = $state<AppError | undefined>(undefined);

    let resolvePromise: (value: T) => void = undefined!;
    let rejectPromise: (reason?: unknown) => void = undefined!;

    const promise = new Promise<T>((resolve, reject) => {
        resolvePromise = resolve;
        rejectPromise = reject;
    }) as QueryLike<T>;

    const execute = async () => {
        loading = true;
        current = undefined;
        error = undefined;

        if (delayMs > 0) {
            await async.delay(delayMs);
        }

        try {
            const data = await asyncFn();
            if (isAppError(data)) {
                error = data;
                rejectPromise(data);
            } else {
                current = data;
                resolvePromise(data);
            }
        } catch (err) {
            error = createAppError(err);
            rejectPromise(err);
        } finally {
            loading = false;
        }
    };

    Object.defineProperties(promise, {
        loading: {
            get() {
                return loading;
            }
        },
        current: {
            get() {
                return current;
            }
        },
        error: {
            get() {
                return error;
            }
        },
        refresh: {
            value: async () => {
                execute();
            }
        }
    });

    execute();
    return promise;
}

export default {
    loading<T>(): QueryLike<T> {
        return createAwaited<T>(async.never(), true, undefined, undefined);
    },

    error<T>(error: AppError): QueryLike<T> {
        const promise = Promise.reject(error);
        promise.catch(() => {});

        return createAwaited<T>(promise, false, undefined, error);
    },

    success<T>(data: Awaited<T>): QueryLike<T> {
        return createAwaited<T>(async.resolved(data), false, data, undefined);
    },

    async<T>(asyncFn: () => Promise<T>, delayMs: number = 0): QueryLike<T> {
        return createFromAsync<T>(asyncFn, delayMs);
    }
};
