<script module lang="ts">
    import type { ClassValue } from 'clsx';
    import type { Snippet } from 'svelte';
    import { cn } from '@lib/ui/utils';

    export interface Props {
        class?: ClassValue | null;
        children: Snippet;
    }
</script>

<script lang="ts">
    let { children, class: className }: Props = $props();

    let mainClass = $derived(cn('h-full w-full', 'flex flex-col items-center justify-center p-4 md:p-8', className));
</script>

<main data-slot="app-content" class={mainClass}>
    {@render children()}
</main>
