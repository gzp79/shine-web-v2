import log from 'loglevel';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const WARN = log.levels.WARN;
const INFO = log.levels.INFO;
const TRACE = log.levels.TRACE;

// The logger reads `LOG_LEVEL` once at import: from localStorage when a window exists, else process.env.
async function importLoggersWith(config: string) {
    vi.resetModules();
    if (typeof window !== 'undefined') window.localStorage.setItem('LOG_LEVEL', config);
    else vi.stubEnv('LOG_LEVEL', config);
    return await import('./loggers');
}

describe('LOG_LEVEL config', () => {
    beforeEach(() => {
        for (const name of ['api', 'game', 'user']) log.getLogger(name).setLevel(WARN, false);
    });

    afterEach(() => {
        if (typeof window !== 'undefined') window.localStorage.removeItem('LOG_LEVEL');
        vi.unstubAllEnvs();
    });

    test('a global level applies to every named logger', async () => {
        await importLoggersWith('info');

        expect(log.getLogger('api').getLevel()).toBe(INFO);
        expect(log.getLogger('game').getLevel()).toBe(INFO);
        expect(log.getLogger('user').getLevel()).toBe(INFO);
    });

    test('a per-tag level overrides the global one', async () => {
        await importLoggersWith('warn,api=trace');

        expect(log.getLogger('api').getLevel()).toBe(TRACE);
        expect(log.getLogger('game').getLevel()).toBe(WARN);
    });
});
