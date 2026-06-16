import { testInEffectRoot } from '@testing';
import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { autoRefresh } from './_auto-refresh.svelte';

/** Set document.visibilityState and dispatch the matching event. */
function setVisibility(state: 'visible' | 'hidden') {
    Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
}

describe('autoRefresh', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        setVisibility('visible');
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    test('refreshes once the TTL elapses', () => {
        const refresh = vi.fn().mockResolvedValue(undefined);

        testInEffectRoot(() => {
            autoRefresh(refresh, () => true, { maxTTL: 1000, ageCheckInterval: 100 });
        });

        expect(refresh).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1100);
        flushSync();

        expect(refresh).toHaveBeenCalledTimes(1);
    });

    test('does not refresh while canRefresh is false', () => {
        const refresh = vi.fn().mockResolvedValue(undefined);

        testInEffectRoot(() => {
            autoRefresh(refresh, () => false, { maxTTL: 1000, ageCheckInterval: 100 });
        });

        vi.advanceTimersByTime(5000);
        flushSync();

        expect(refresh).not.toHaveBeenCalled();
    });

    test('treats an omitted canRefresh as enabled', () => {
        const refresh = vi.fn().mockResolvedValue(undefined);

        testInEffectRoot(() => {
            autoRefresh(refresh, undefined, { maxTTL: 1000, ageCheckInterval: 100 });
        });

        vi.advanceTimersByTime(1100);
        flushSync();

        expect(refresh).toHaveBeenCalledTimes(1);
    });

    test('does not start a second refresh while one is in flight', async () => {
        let resolveRefresh!: () => void;
        const refresh = vi.fn(() => new Promise<void>((resolve) => (resolveRefresh = resolve)));

        testInEffectRoot(() => {
            autoRefresh(refresh, () => true, { maxTTL: 1000, ageCheckInterval: 100 });
        });

        vi.advanceTimersByTime(1100);
        flushSync();
        expect(refresh).toHaveBeenCalledTimes(1);

        // TTL is still expired, but the in-flight guard must suppress a re-entry.
        vi.advanceTimersByTime(1100);
        flushSync();
        expect(refresh).toHaveBeenCalledTimes(1);

        resolveRefresh();
        await Promise.resolve();
    });

    test('forces a refresh when the tab becomes visible', () => {
        const refresh = vi.fn().mockResolvedValue(undefined);

        testInEffectRoot(() => {
            autoRefresh(refresh, () => true, { maxTTL: 60_000, ageCheckInterval: 100 });
        });

        // Well within TTL: no refresh yet.
        vi.advanceTimersByTime(1000);
        flushSync();
        expect(refresh).not.toHaveBeenCalled();

        // Returning to the tab expires the clock and triggers an immediate refresh.
        setVisibility('hidden');
        flushSync();
        setVisibility('visible');
        flushSync();
        vi.advanceTimersByTime(100);
        flushSync();

        expect(refresh).toHaveBeenCalledTimes(1);
    });

    test('stops refreshing after the effect root is disposed', () => {
        const refresh = vi.fn().mockResolvedValue(undefined);

        const cleanup = testInEffectRoot(() => {
            autoRefresh(refresh, () => true, { maxTTL: 1000, ageCheckInterval: 100 });
        });

        cleanup(); // early teardown — root is already gone before timers fire

        vi.advanceTimersByTime(5000);
        flushSync();

        expect(refresh).not.toHaveBeenCalled();
    });

    test('retries after refresh() rejects', async () => {
        const refresh = vi.fn().mockRejectedValueOnce(new Error('network error')).mockResolvedValue(undefined);

        testInEffectRoot(() => {
            autoRefresh(refresh, () => true, { maxTTL: 1000, ageCheckInterval: 100 });
        });

        vi.advanceTimersByTime(1100);
        flushSync();
        expect(refresh).toHaveBeenCalledTimes(1);

        // Drain the .catch() → .finally() microtask chain (3 ticks: reject, catch, finally).
        const PROMISE_CHAIN_DEPTH = 3;
        for (let i = 0; i < PROMISE_CHAIN_DEPTH; i++) await Promise.resolve();
        flushSync();

        expect(refresh).toHaveBeenCalledTimes(2);
    });

    test('refreshes again after the second TTL elapses', async () => {
        const refresh = vi.fn().mockResolvedValue(undefined);

        testInEffectRoot(() => {
            autoRefresh(refresh, () => true, { maxTTL: 1000, ageCheckInterval: 100 });
        });

        vi.advanceTimersByTime(1100);
        flushSync();
        expect(refresh).toHaveBeenCalledTimes(1);

        // Drain the .then() → .finally() microtask chain so lastUpdate is reset before advancing.
        const PROMISE_CHAIN_DEPTH = 3;
        for (let i = 0; i < PROMISE_CHAIN_DEPTH; i++) await Promise.resolve();
        flushSync();

        vi.advanceTimersByTime(1100);
        flushSync();

        expect(refresh).toHaveBeenCalledTimes(2);
    });

    test('resolving an in-flight refresh after disposal does not throw', async () => {
        let resolveRefresh!: () => void;
        const refresh = vi.fn(() => new Promise<void>((resolve) => (resolveRefresh = resolve)));

        const cleanup = testInEffectRoot(() => {
            autoRefresh(refresh, () => true, { maxTTL: 1000, ageCheckInterval: 100 });
        });

        vi.advanceTimersByTime(1100);
        flushSync();
        expect(refresh).toHaveBeenCalledTimes(1);

        cleanup(); // dispose while refresh is still in-flight

        resolveRefresh();
        await Promise.resolve(); // should not throw or warn
    });

    test('triggers an immediate refresh when canRefresh becomes true with an expired TTL', () => {
        const refresh = vi.fn().mockResolvedValue(undefined);
        let allowed = $state(false);

        testInEffectRoot(() => {
            autoRefresh(refresh, () => allowed, { maxTTL: 1000, ageCheckInterval: 100 });
        });

        // TTL expires while gate is closed.
        vi.advanceTimersByTime(2000);
        flushSync();
        expect(refresh).not.toHaveBeenCalled();

        // Gate opens — refresh fires on the next reactive flush, no timer tick needed.
        allowed = true;
        flushSync();
        expect(refresh).toHaveBeenCalledTimes(1);
    });
});
