import { flushSync } from 'svelte';
import { afterEach } from 'vitest';

/**
 * Run a runes setup fn inside an effect root so its $effect/$derived are live
 * for the duration of the test. The root is disposed automatically after each
 * test. Returns the disposer for tests that need early teardown.
 */
export function testInEffectRoot(fn: () => void): () => void {
    const cleanup = $effect.root(fn);
    flushSync();
    afterEach(cleanup);
    return cleanup;
}
