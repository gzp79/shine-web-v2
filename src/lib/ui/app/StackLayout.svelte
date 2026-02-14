<script module lang="ts">
    import type { ClassValue } from 'clsx';
    import type { Snippet } from 'svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import { cn } from '@lib/ui/utils';

    export interface StackLayoutProps {
        class?: ClassValue | null;
        children: Snippet;
    }
</script>

<script lang="ts">
    let { children, class: className }: StackLayoutProps = $props();

    const mainClass = $derived(cn('w-full', 'p-4 overflow-y-auto md:p-8', className));
</script>

<main data-slot="app-content" class={mainClass}>
    <Stack spacing={8} class="items-center justify-center">
        {@render children()}
    </Stack>
</main>
