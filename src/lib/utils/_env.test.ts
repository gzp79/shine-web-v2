import { describe, expect, test } from 'vitest';
import { config } from '@generated/config';
import { IS_MOCK, IS_PROD } from './_env';

describe('env flags', () => {
    // Outside the client bundle Vite hands the `VITE_*` defines back as strings, so a raw
    // `if (import.meta.env.VITE_MOCK)` is truthy even for `'false'`. These must stay real booleans
    // that track the selected environment, whichever environment the suite happens to run under.
    test('are booleans', () => {
        expect(typeof IS_MOCK).toBe('boolean');
        expect(typeof IS_PROD).toBe('boolean');
    });

    test('match the selected config', () => {
        expect(IS_MOCK).toBe(config.environment === 'mock');
        expect(IS_PROD).toBe(config.environment === 'prod');
    });
});
