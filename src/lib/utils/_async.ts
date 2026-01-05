export abstract class WrappedPromise<T> implements Promise<T> {
    protected abstract get _promise(): Promise<T>;

    then<TResult1 = T, TResult2 = never>(
        onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ): Promise<TResult1 | TResult2> {
        return this._promise.then(onfulfilled, onrejected);
    }

    catch<TResult = never>(
        onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null
    ): Promise<T | TResult> {
        return this._promise.catch(onrejected);
    }

    finally(onfinally?: (() => void) | null): Promise<T> {
        return this._promise.finally(onfinally);
    }

    get [Symbol.toStringTag](): string {
        return this._promise[Symbol.toStringTag];
    }
}

export const async = {
    delay(ms: number): Promise<void> {
        return new Promise((resolver) => setTimeout(resolver, ms));
    },

    never(): Promise<never> {
        return new Promise(() => {});
    },

    abort(error: unknown): Promise<never> {
        return (async () => {
            throw error;
        })();
    },

    resolved<T>(data: T): Promise<T> {
        return Promise.resolve(data);
    },

    rejected<E>(error: E): Promise<never> {
        return Promise.reject(error);
    },

    async error(error: Error): Promise<never> {
        throw error;
    }
};
