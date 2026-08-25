<script module lang="ts">
    import type { ClassValue } from 'clsx';
    import { getUserStore } from '@lib/account/userStore.svelte';
    import { cn } from '@lib/ui/utils';

    export type UserNameProps = {
        /** Id of the user to resolve. */
        id: string;
        /** Shown until the name is known (default: `…`). */
        placeholder?: string;
        /** Shown instead of the name when `id` is the current user. */
        selfLabel?: string;
        /** Shown when the lookup failed (defaults to `placeholder`). */
        fallback?: string;
        class?: ClassValue;
    };
</script>

<script lang="ts">
    let { id, placeholder = '…', selfLabel, fallback, class: className }: UserNameProps = $props();

    const users = getUserStore();

    // Reactive get-or-fetch: the store references and loads the entry while we render this id,
    // and releases it automatically when we stop.
    const user = $derived(users.get(id));

    const label = $derived.by(() => {
        if (selfLabel !== undefined && users.meId === id) return selfLabel;
        if (user.name !== undefined) return user.name;
        return user.error ? (fallback ?? placeholder) : placeholder;
    });
</script>

<span
    data-slot="user-name"
    data-loading={user.loading ? '' : undefined}
    class={cn(user.name === undefined && 'opacity-60', className)}>{label}</span
>
