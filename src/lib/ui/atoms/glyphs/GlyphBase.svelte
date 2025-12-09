<script lang="ts" module>
    import type { ClassValue } from 'clsx';
    import type { Component, Snippet } from 'svelte';
    import type { IconSize } from '@lib/ui/atoms';
    import { cn } from '@lib/ui/utils';

    export type GlyphProps = {
        size?: IconSize;
        disabled?: boolean;
        class?: ClassValue | null;
    };

    export type GlyphSet = Record<string, Component<GlyphProps>>;

    export type GlyphBaseProps = GlyphProps & {
        viewBox: [number, number, number, number];
        children: Snippet;
    };
</script>

<script lang="ts">
    const iconSizes: Record<IconSize, string> = {
        text: 'w-auto h-[1.2em]',
        xs: 'w-auto h-6',
        sm: 'w-auto h-8',
        md: 'w-auto h-12',
        lg: 'w-auto h-14',
        full: 'w-auto h-full object-contain'
    };

    let { size = 'text', disabled = false, class: className, viewBox, children }: GlyphBaseProps = $props();
    let svgClass = $derived(
        cn(
            iconSizes[size],
            disabled && '!opacity-30',
            //disabled && 'grayscale'
            className
        )
    );
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox.join(' ')} class={svgClass}>
    {@render children()}
</svg>
