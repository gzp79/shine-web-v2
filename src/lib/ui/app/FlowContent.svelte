<script module lang="ts">
    import type { ClassValue } from 'clsx';
    import type { Snippet } from 'svelte';
    import { cn } from '@lib/ui/utils';
    import Stack from '../atoms/layouts/Stack.svelte';

    export interface Props {
        class?: ClassValue | null;
        children: Snippet;
    }
</script>

<script lang="ts">
    let { children, class: className }: Props = $props();

    let mainClass = $derived(cn('w-full', 'p-4 overflow-y-auto md:p-8', className));
</script>

<main data-slot="app-content" class={mainClass}>
    <Stack spacing={4} class="items-center justify-center">
        {@render children()}
    </Stack>
</main>
