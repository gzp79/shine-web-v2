import { describe, expect, test } from 'vitest';
import { createAppError, createOtherError, loginPageUrl } from './_error';

describe('loginPageUrl', () => {
    test('omits everything that was not asked for', () => {
        expect(loginPageUrl()).toBe('/login');
        expect(loginPageUrl({ returnUrl: null, prompt: false })).toBe('/login');
    });

    test('carries the returnUrl, encoded', () => {
        expect(loginPageUrl({ returnUrl: '/account?tab=sessions' })).toBe(
            '/login?returnUrl=%2Faccount%3Ftab%3Dsessions'
        );
    });

    test('carries the hint that explains why the user is here', () => {
        expect(loginPageUrl({ returnUrl: '/account', hint: 'login-expired' })).toBe(
            '/login?returnUrl=%2Faccount&hint=login-expired'
        );
    });

    test('asks for credentials directly when prompted', () => {
        expect(loginPageUrl({ prompt: true, errorType: 'auth-session-expired' })).toBe(
            '/login?prompt=true&errorType=auth-session-expired'
        );
    });
});

describe('createAppError', () => {
    test('returns an AppError unchanged', () => {
        const appError = createOtherError('already wrapped', { attempt: 1 });
        expect(createAppError(appError)).toBe(appError);
    });

    test('unwraps the AppError an App.Error carries', () => {
        const appError = createOtherError('from handleError');
        expect(createAppError({ message: 'Internal Error', appError })).toBe(appError);
    });

    describe('HttpError', () => {
        test('takes the message and status from the body', () => {
            const result = createAppError({ status: 502, body: { message: 'Remote service unavailable' } });

            expect(result.kind).toBe('fetch');
            expect(result.message).toBe('Remote service unavailable');
            expect(result.details).toEqual({ status: 502 });
        });

        test('falls back to a top-level message, then to the status', () => {
            expect(createAppError({ status: 418, message: 'teapot' }).message).toBe('teapot');
            expect(createAppError({ status: 503, body: {} }).message).toBe('HTTP 503');
        });

        test('does not mistake an Error subclass with a status for one', () => {
            class ApiError extends Error {
                status = 503;
            }
            const result = createAppError(new ApiError('upstream down'));

            expect(result.kind).toBe('other');
            expect(result.message).toBe('upstream down');
        });

        test('unwraps the AppError the body carries', () => {
            const appError = createOtherError('upstream detail');
            expect(createAppError({ status: 502, body: { message: 'generic', appError } })).toBe(appError);
        });
    });

    describe('an HttpError stringified into an Error', () => {
        const serialized = JSON.stringify({ status: 500, message: 'Session expired' });

        test('recovers the message from an Error', () => {
            expect(createAppError(new Error(serialized)).message).toBe('Session expired');
        });

        test('recovers the message from a string', () => {
            expect(createAppError(serialized).message).toBe('Session expired');
        });

        test('recovers the embedded AppError, keeping its kind and details', () => {
            const appError = createOtherError('the real failure', { retryCount: 4 });
            const text = JSON.stringify({ status: 500, message: 'Internal Error', appError });

            const result = createAppError(new Error(text));

            expect(result.kind).toBe('other');
            expect(result.message).toBe('the real failure');
            expect(result.details).toEqual({ retryCount: 4 });
        });

        test('leaves a message that merely looks like JSON alone', () => {
            expect(createAppError(new Error('{not json')).message).toBe('{not json');
            expect(createAppError(new Error('{"other":"keys"}')).message).toBe('{"other":"keys"}');
        });
    });

    test('wraps a plain Error, a string and an unknown throw', () => {
        expect(createAppError(new Error('boom')).message).toBe('boom');
        expect(createAppError('just text').message).toBe('just text');
        expect(createAppError(Symbol('nope')).message).toBe('Unknown error');
    });
});
