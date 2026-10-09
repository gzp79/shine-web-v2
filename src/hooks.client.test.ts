import type { NavigationEvent } from '@sveltejs/kit';
import type { ClientCaughtError } from '@sveltejs/kit/hooks';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { logAPI } from '@lib/loggers';
import { createOtherError } from '@lib/utils';
import { handleError } from './hooks.client';

const event: NavigationEvent = {
    params: {},
    route: { id: null },
    url: new URL('https://local.scytta.com/game')
};

const callHandleError = (caught: ClientCaughtError) => handleError({ ...caught, event });

describe('handleError (client)', () => {
    beforeEach(() => {
        vi.spyOn(logAPI, 'error').mockImplementation(() => {});
    });

    test('leaves app and framework errors to their defaults', () => {
        expect(callHandleError({ kind: 'framework', error: { status: 404, message: 'Not Found' } })).toBeUndefined();
        expect(callHandleError({ kind: 'app', error: { status: 403, message: 'thrown by error()' } })).toBeUndefined();
    });

    test('normalizes an unexpected throw and logs it', () => {
        const result = callHandleError({ kind: 'unknown', error: new Error('boom') });

        expect(result).toEqual(expect.objectContaining({ message: 'boom' }));
        expect(logAPI.error).toHaveBeenCalled();
    });

    test('passes an AppError through untouched', () => {
        const appError = createOtherError('already wrapped', { attempt: 1 });
        const result = callHandleError({ kind: 'unknown', error: appError });

        expect(result).toEqual({ message: 'already wrapped', appError });
    });
});
