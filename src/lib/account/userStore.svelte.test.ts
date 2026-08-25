import { testInEffectRoot } from '@testing';
import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { logUser } from '@lib/loggers';
import { BrowserUserStore, type PublicUserEntry, type UserStoreOptions } from './userStore.svelte';

const DEBOUNCE = 100;

/** A lookup that echoes each id back as `name:<id>`, so a request is observable in the result. */
function echoLookup() {
    return vi.fn(async (ids: string[]) => Object.fromEntries(ids.map((id) => [id, { name: `name:${id}` }])));
}

let store: BrowserUserStore | undefined;

function makeStore(options: UserStoreOptions): BrowserUserStore {
    store = new BrowserUserStore(options);
    return store;
}

/**
 * Mount a reactive reader for `id`, the way a component's `$derived(users.get(id))` would.
 * Reading a field inside the effect tracks the entry and drives `createSubscriber`'s start.
 * The entry is a `$state` proxy mutated in place, so the captured reference stays valid.
 */
function read(s: BrowserUserStore, id: string): { entry: PublicUserEntry; dispose: () => void } {
    let captured: PublicUserEntry | undefined;
    const dispose = testInEffectRoot(() => {
        $effect(() => {
            const entry = s.get(id);
            captured = entry;
            void entry.loading;
            void entry.name;
        });
    });
    return { entry: captured!, dispose };
}

/** Drain the lookup's microtask chain (fake timers do not fake promises), then propagate. */
async function settle(): Promise<void> {
    for (let i = 0; i < 10; i++) await Promise.resolve();
    flushSync();
}

describe('BrowserUserStore', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        store?.destroy();
        store = undefined;
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    test('references an entry while it is read and releases it when the reader is torn down', async () => {
        const lookup = echoLookup();
        const s = makeStore({ lookup, debounceMs: DEBOUNCE, ttlMs: 1000, sweepIntervalMs: 0 });

        const reader = read(s, 'u1');
        expect(reader.entry.refs).toBe(1);
        expect(reader.entry.loading).toBe(true);

        vi.advanceTimersByTime(DEBOUNCE);
        await settle();
        expect(reader.entry.name).toBe('name:u1');
        expect(reader.entry.loading).toBe(false);
        expect(reader.entry.refs).toBe(1);

        reader.dispose();
        flushSync();
        expect(reader.entry.refs).toBe(0);
    });

    test('sweep keeps a fresh entry but evicts it once stale and unreferenced', () => {
        const s = makeStore({ lookup: echoLookup(), debounceMs: DEBOUNCE, ttlMs: 1000, sweepIntervalMs: 0 });

        // Seed a fresh, unreferenced entry by faking a past resolution.
        const seeded = s.get('u1');
        seeded.name = 'name:u1';
        seeded.fetchedAt = Date.now();

        s.sweep();
        expect(s.get('u1')).toBe(seeded);

        vi.advanceTimersByTime(1001);
        s.sweep();
        const fresh = s.get('u1');
        expect(fresh).not.toBe(seeded);
        expect(fresh.name).toBeUndefined();
    });

    test('collects ids read within one debounce window into a single lookup', async () => {
        const lookup = echoLookup();
        const s = makeStore({ lookup, debounceMs: DEBOUNCE, sweepIntervalMs: 0 });

        const a = read(s, 'a');
        const b = read(s, 'b');
        expect(lookup).not.toHaveBeenCalled();

        vi.advanceTimersByTime(DEBOUNCE);
        await settle();

        expect(lookup).toHaveBeenCalledTimes(1);
        expect([...lookup.mock.calls[0]![0]].sort()).toEqual(['a', 'b']);
        expect(a.entry.name).toBe('name:a');
        expect(b.entry.name).toBe('name:b');
    });

    test('splits a batch larger than maxBatchSize into sequential chunks', async () => {
        const lookup = echoLookup();
        const s = makeStore({ lookup, debounceMs: DEBOUNCE, maxBatchSize: 2, sweepIntervalMs: 0 });

        read(s, 'a');
        read(s, 'b');
        read(s, 'c');

        vi.advanceTimersByTime(DEBOUNCE);
        await settle();

        expect(lookup).toHaveBeenCalledTimes(2);
        expect(lookup.mock.calls[0]![0]).toHaveLength(2);
        expect(lookup.mock.calls[1]![0]).toHaveLength(1);
    });

    test('does not refetch a fresh entry but re-queues once it is stale', async () => {
        const lookup = echoLookup();
        const s = makeStore({ lookup, debounceMs: DEBOUNCE, ttlMs: 1000, sweepIntervalMs: 0 });

        const first = read(s, 'a');
        vi.advanceTimersByTime(DEBOUNCE);
        await settle();
        expect(lookup).toHaveBeenCalledTimes(1);
        first.dispose();
        flushSync();

        // Re-read while still within ttl: no new request.
        const second = read(s, 'a');
        expect(second.entry.loading).toBe(false);
        vi.advanceTimersByTime(DEBOUNCE);
        await settle();
        expect(lookup).toHaveBeenCalledTimes(1);
        second.dispose();
        flushSync();

        // Past ttl the next read re-queues.
        vi.advanceTimersByTime(1001);
        const third = read(s, 'a');
        expect(third.entry.loading).toBe(true);
        vi.advanceTimersByTime(DEBOUNCE);
        await settle();
        expect(lookup).toHaveBeenCalledTimes(2);
    });

    test('records the transport error and clears loading on failure', async () => {
        vi.spyOn(logUser, 'error').mockImplementation(() => {});
        const lookup = vi.fn(async () => {
            throw new Error('network down');
        });
        const s = makeStore({ lookup, debounceMs: DEBOUNCE, sweepIntervalMs: 0 });

        const a = read(s, 'a');
        vi.advanceTimersByTime(DEBOUNCE);
        await settle();

        expect(a.entry.error).toBe('network down');
        expect(a.entry.loading).toBe(false);
        expect(a.entry.name).toBeUndefined();
        expect(a.entry.isUnknown).toBe(false);
    });

    test('marks an id the backend omits as unknown', async () => {
        const lookup = vi.fn(async () => ({}));
        const s = makeStore({ lookup, debounceMs: DEBOUNCE, sweepIntervalMs: 0 });

        const a = read(s, 'ghost');
        vi.advanceTimersByTime(DEBOUNCE);
        await settle();

        expect(a.entry.isUnknown).toBe(true);
        expect(a.entry.error).toBeUndefined();
        expect(a.entry.name).toBeUndefined();
        expect(a.entry.loading).toBe(false);
    });

    test('re-resolves an entry that is still being read when invalidated', async () => {
        let round = 0;
        const lookup = vi.fn(async (ids: string[]) =>
            Object.fromEntries(ids.map((id) => [id, { name: `${id}#${++round}` }]))
        );
        const s = makeStore({ lookup, debounceMs: DEBOUNCE, ttlMs: 100_000, sweepIntervalMs: 0 });

        const a = read(s, 'a');
        vi.advanceTimersByTime(DEBOUNCE);
        await settle();
        expect(a.entry.name).toBe('a#1');

        s.invalidate('a');
        expect(a.entry.loading).toBe(true);
        vi.advanceTimersByTime(DEBOUNCE);
        await settle();
        expect(lookup).toHaveBeenCalledTimes(2);
        expect(a.entry.name).toBe('a#2');
    });

    test('upgrades the current user in place and never fetches it', async () => {
        const lookup = echoLookup();
        const s = makeStore({
            getMe: () => ({ id: 'me', name: 'Current User' }),
            lookup,
            debounceMs: DEBOUNCE,
            sweepIntervalMs: 0
        });
        flushSync(); // run the me-reconciliation effect

        const me = read(s, 'me');
        expect(me.entry.name).toBe('Current User');
        expect(me.entry.loading).toBe(false);

        // invalidate skips the me entry, and no batch is ever issued for it.
        s.invalidate('me');
        vi.advanceTimersByTime(DEBOUNCE);
        await settle();
        expect(lookup).not.toHaveBeenCalled();
        expect(me.entry.name).toBe('Current User');
    });

    test('use() outside component initialisation throws and rolls back its reference', () => {
        const s = makeStore({ lookup: echoLookup(), debounceMs: DEBOUNCE, sweepIntervalMs: 0 });

        expect(() => s.use('a')).toThrow(/outside component initialisation/);
        expect(s.get('a').refs).toBe(0);
    });
});
