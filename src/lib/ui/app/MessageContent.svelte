<script module lang="ts">
    import type { ClassValue } from 'clsx';
    import type { Snippet } from 'svelte';
    import Overlay, { type OverlayProps } from '@lib/ui/atoms/Overlay.svelte';
    import { cn } from '@lib/ui/utils';

    export interface MessageContentProps {
        class?: ClassValue | null;
        overlay?: OverlayProps;
        children: Snippet;
    }
</script>

<script lang="ts">
    let { children, overlay, class: className }: MessageContentProps = $props();

    const mainClass = $derived(
        cn('relative h-full w-full', 'flex flex-col items-center justify-center p-4 md:p-8', className)
    );
</script>

<main data-slot="app-content" class={mainClass}>
    {#if overlay}
        <Overlay {...overlay} />
    {/if}
    {@render children()}
</main>
