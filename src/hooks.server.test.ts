import type { RequestEvent } from '@sveltejs/kit';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { logAPI } from '#lib/loggers';
import { createOtherError, createRetryLimitError } from '#lib/utils';
import { handleError } from './hooks.server';

// Pin the prod masking regardless of the selected env: `VERBOSE_ERRORS` derives from `IS_PROD`.
// `IS_MOCK: false` also keeps the module body from starting the MSW server.
vi.mock('#lib/utils/_env', async (importOriginal) => ({
    ...(await importOriginal<typeof import('#lib/utils/_env')>()),
    IS_PROD: true,
    IS_MOCK: false
}));
vi.mock('#mocks/setup-server', () => ({}));

type Input = Parameters<typeof handleError>[0];
const callHandleError = (caught: Pick<Input, 'kind' | 'error'>) =>
    handleError({ ...caught, status: 500, message: 'Internal Error', event: {} as RequestEvent } as Input);

describe('handleError (server, prod)', () => {
    beforeEach(() => {
        vi.spyOn(logAPI, 'error').mockImplementation(() => {});
    });

    test('masks the raw message of a non-app throw', () => {
        const result = callHandleError({
            kind: 'unknown',
            error: new Error('connect ECONNREFUSED 10.0.3.7:5432 user=svc')
        });

        expect(JSON.stringify(result)).not.toContain('ECONNREFUSED');
        expect(result).toEqual(
            expect.objectContaining({
                appError: expect.objectContaining({ kind: 'other', message: 'Unexpected error', details: undefined })
            })
        );
    });

    test('masks a thrown string', () => {
        const result = callHandleError({ kind: 'unknown', error: 'secret=hunter2' });

        expect(JSON.stringify(result)).not.toContain('hunter2');
    });

    test('keeps the message of an AppError but drops its details', () => {
        const result = callHandleError({ kind: 'unknown', error: createOtherError('Failed to load', { token: 'x' }) });

        expect(result).toEqual(
            expect.objectContaining({
                appError: expect.objectContaining({ message: 'Failed to load', details: undefined })
            })
        );
    });

    test('drops the last error of a retry limit', () => {
        const result = callHandleError({
            kind: 'unknown',
            error: createRetryLimitError(3, new Error('db password=hunter2'))
        });

        expect(JSON.stringify(result)).not.toContain('hunter2');
    });

    test('leaves non-unknown errors to their defaults', () => {
        expect(callHandleError({ kind: 'framework', error: { status: 404, message: 'Not Found' } })).toBeUndefined();
    });
});
