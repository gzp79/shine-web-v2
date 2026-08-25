<script module lang="ts">
    import type { PublicUserData } from '@lib/account/userStore.svelte';

    /** Mutually exclusive lookup outcomes: a batch resolves, hangs, or fails. */
    export type MockLookup =
        | { kind: 'resolved'; users?: Record<string, PublicUserData> }
        | { kind: 'pending' }
        | { kind: 'error' };
</script>

<script lang="ts">
    import type { Snippet } from 'svelte';
    import { type CurrentUserLike, provideUserStore } from '@lib/account/userStore.svelte';

    let {
        result = { kind: 'resolved' },
        me,
        children
    }: {
        /** How the fake lookup behaves; defaults to resolving with no known users. */
        result?: MockLookup;
        /** Current user reconciled into the cache without a fetch. */
        me?: CurrentUserLike;
        children: Snippet;
    } = $props();

    // provideUserStore builds the real BrowserUserStore in Storybook (browser); a fake
    // lookup replaces the BFF transport, and the sweep timer is off so stories stay static.
    provideUserStore({
        getMe: () => me,
        sweepIntervalMs: 0,
        lookup: async (ids) => {
            if (result.kind === 'pending') return new Promise<Record<string, PublicUserData>>(() => {});
            if (result.kind === 'error') throw new Error('lookup failed');

            const known = result.users ?? {};
            const resolved: Record<string, PublicUserData> = {};
            for (const id of ids) {
                const user = known[id];
                if (user) resolved[id] = user;
            }
            return resolved;
        }
    });
</script>

{@render children()}
