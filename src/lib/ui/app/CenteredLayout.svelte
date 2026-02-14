<script module lang="ts">
    import type { ClassValue } from 'clsx';
    import type { Snippet } from 'svelte';
    import { type ResponsiveSpacing, toSpacingClasses } from '@lib/ui/atoms';
    import { cn } from '@lib/ui/utils';

    export interface CenteredLayoutProps {
        padding?: ResponsiveSpacing;
        class?: ClassValue | null;
        children: Snippet;
    }
</script>

<script lang="ts">
    let { children, padding = 4, class: className }: CenteredLayoutProps = $props();

    const mainClass = $derived(
        cn(
            'relative h-full w-full', //
            'flex flex-col items-center justify-center',
            toSpacingClasses(padding, { all: 'p', x: 'px', y: 'py' }),
            className
        )
    );
</script>

<main data-slot="app-content" class={mainClass}>
    {@render children()}
</main>
