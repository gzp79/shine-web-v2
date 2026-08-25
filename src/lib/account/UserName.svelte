<script module lang="ts">
    import type { ClassValue } from 'clsx';
    import { getUserStore } from '@lib/account/userStore.svelte';
    import { getLocaleContext } from '@lib/i18n';
    import { cn } from '@lib/ui/utils';

    export type UserNameProps = {
        /** Id of the user to resolve. */
        id: string;
        /** Shown until the name is known (default: `…`). */
        placeholder?: string;
        /** Shown instead of the name when `id` is the current user. */
        selfLabel?: string;
        /** Label for a user that cannot be resolved (defaults to the localized "Anonymous"). */
        fallback?: string;
        class?: ClassValue;
    };
</script>

<script lang="ts">
    let { id, placeholder = '…', selfLabel, fallback, class: className }: UserNameProps = $props();

    const users = getUserStore();
    const locale = getLocaleContext();

    // Reactive get-or-fetch: the store references and loads the entry while we render this id,
    // and releases it automatically when we stop.
    const user = $derived(users.get(id));

    const label = $derived.by(() => {
        if (selfLabel !== undefined && users.meId === id) return selfLabel;
        if (user.name !== undefined) return user.name;
        if (user.isUnknown) return fallback ?? locale.t('common.anonymousUser');
        // A transient error (e.g. network) keeps the placeholder while the lookup may still retry.
        if (user.error) return fallback ?? placeholder;
        return placeholder;
    });
</script>

<span
    data-slot="user-name"
    data-loading={user.loading ? '' : undefined}
    class={cn(user.name === undefined && 'opacity-60', className)}>{label}</span
>
