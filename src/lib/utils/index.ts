import { browser } from '$app/environment';

export type Nullable<T> = T | null;
export function maybeNull<T>(): Nullable<T> {
    return null;
}

type ErrorKind = 'fetch' | 'other' | 'schema' | 'internal';

// A interface for any ssr error that is captured and delegated to the client
export interface AppError {
    errorKind: ErrorKind;
    message: string;
    detail?: unknown;
}

export type Fetch = (input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<Response>;

export class FetchError implements AppError {
    errorKind: ErrorKind = 'fetch';

    constructor(
        public message: string,
        public detail: { status: number; body: string }
    ) {}
}

export class OtherError implements AppError {
    errorKind: ErrorKind = 'other';
    constructor(
        public message: string,
        public detail?: unknown
    ) {}
}

export class SchemaError implements AppError {
    errorKind: ErrorKind = 'schema';

    constructor(public message: string) {}
}

export class InternalError implements AppError {
    errorKind: ErrorKind = 'internal';

    constructor(
        public message: string,
        public detail?: unknown
    ) {}
}

// When building for CF, the cache is disabled and should not be set in the fetch options
export function fetchCacheOption(cache: RequestCache): Partial<RequestInit> {
    if (browser) {
        return { cache };
    }
    return {};
}

export async function fetchError(message: string, response: Response): Promise<FetchError> {
    const body = await response.text();
    return new FetchError(message, { status: response.status, body });
}

export function assert(condition: boolean, message: string): asserts condition {
    if (!condition) {
        throw new InternalError('Assertion failed: ' + message);
    }
}

export const async = {
    delay(ms: number): Promise<void> {
        return new Promise((resolver) => setTimeout(resolver, ms));
    },

    never(): Promise<never> {
        return new Promise(() => {});
    },

    resolved<T>(data: T): Promise<T> {
        return Promise.resolve(data);
    },

    async error(error: Error): Promise<never> {
        throw error;
    }
};

export * from './_cookie';
