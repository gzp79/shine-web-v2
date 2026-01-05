import { getRequestEvent } from '$app/server';
import type { AppError } from './_error';

export type WithRefresh = { refresh: () => Promise<void> };
export type WithError<E = AppError> = { error?: E };
export type WithCurrent<T> = { current?: T };
export type WithLoading = { loading: boolean };
export type WithQuery<T, E = AppError> = WithRefresh & WithError<E> & WithCurrent<T> & WithLoading;

export type QueryLike<T, E = AppError> = Promise<T> & WithQuery<T, E>;

export function getPassThroughHeaders(): Headers {
    const { cookies, request } = getRequestEvent();
    const headers = new Headers();

    const cookie = cookies
        .getAll()
        .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
        .join('; ');
    if (cookie) {
        headers.set('cookie', cookie);
    }

    const userAgent = request.headers.get('user-agent');
    if (userAgent) {
        headers.set('user-agent', userAgent);
    }

    const origin = request.headers.get('origin');
    if (origin) {
        headers.set('origin', origin);
    }

    return headers;
}
