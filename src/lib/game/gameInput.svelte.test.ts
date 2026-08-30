import { testInEffectRoot } from '@testing';
import { flushSync } from 'svelte';
import { describe, expect, test } from 'vitest';
import { GameInputGate } from './gameInput.svelte';

describe('GameInputGate', () => {
    test('starts unsuspended', () => {
        expect(new GameInputGate().suspended).toBe(false);
    });

    test('suspend() suspends and its release resumes', () => {
        const gate = new GameInputGate();
        const release = gate.suspend();
        expect(gate.suspended).toBe(true);
        release();
        expect(gate.suspended).toBe(false);
    });

    test('stays suspended until every claim is released (ref-counted)', () => {
        const gate = new GameInputGate();
        const first = gate.suspend();
        const second = gate.suspend();
        first();
        expect(gate.suspended).toBe(true);
        second();
        expect(gate.suspended).toBe(false);
    });

    test('a release is idempotent and cannot double-decrement', () => {
        const gate = new GameInputGate();
        const other = gate.suspend();
        const release = gate.suspend();
        release();
        release();
        // The second call must not drop `other`'s still-open claim.
        expect(gate.suspended).toBe(true);
        other();
        expect(gate.suspended).toBe(false);
    });

    test('suspended is reactive', () =>
        testInEffectRoot(() => {
            const gate = new GameInputGate();
            let observed: boolean | null = null;
            $effect(() => {
                observed = gate.suspended;
            });
            flushSync();
            expect(observed).toBe(false);

            const release = gate.suspend();
            flushSync();
            expect(observed).toBe(true);

            release();
            flushSync();
            expect(observed).toBe(false);
        }));
});
