import type { AppError } from './_error';

export type WithRefresh = { refresh: () => Promise<void> };
export type WithError<E = AppError> = { error?: E };
export type WithCurrent<T> = { current?: T };
export type WithLoading = { loading: boolean };
export type WithQuery<T, E = AppError> = WithRefresh & WithError<E> & WithCurrent<T> & WithLoading;

export type QueryLike<T, E = AppError> = Promise<T> & WithQuery<T, E>;

export function typeOfT<T>(value: T): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';

    if (Array.isArray(value)) {
        const first = value[0];
        const elemName = typeOfT(first);
        return `Array<${elemName}>`;
    }

    const ctorName = (value as unknown)?.constructor?.name;
    if (ctorName) {
        return ctorName;
    }

    return typeof value;
}
