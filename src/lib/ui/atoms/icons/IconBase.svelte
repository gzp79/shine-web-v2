<script lang="ts" module>
    import type { ClassValue } from 'clsx';
    import type { Component, Snippet } from 'svelte';
    import type { ActionColor, IconSize } from '@lib/ui/atoms';
    import { cn } from '@lib/ui/utils';
    import TailwindClasses from '@lib/ui/utils/TailwindClasses.svelte';

    export const TRANSPARENCY = 0.3;

    export type IconProps = {
        color?: ActionColor;
        size?: IconSize;
        disabled?: boolean;
        class?: ClassValue | null;
        'aria-label'?: string;
    };

    export type IconSet = Record<string, Component<IconProps>>;

    export type IconBaseProps = IconProps & {
        viewBox: [number, number, number, number];
        children: Snippet;
    };
</script>

<script lang="ts">
    let {
        color,
        size = 'text',
        disabled = false,
        class: className,
        viewBox,
        children,
        'aria-label': ariaLabel
    }: IconBaseProps = $props();

    const iconSizes: Record<IconSize, string> = {
        text: 'w-auto h-[1.2em]',
        xs: 'w-auto h-6',
        sm: 'w-auto h-8',
        md: 'w-auto h-12',
        lg: 'w-auto h-14',
        full: 'w-auto h-full object-contain'
    };

    let svgClass = $derived(
        cn(
            color ? `stroke-on-${color}` : 'stroke-current',
            color ? `fill-on-${color}` : 'fill-current',
            iconSizes[size],
            disabled && '!opacity-30',
            className
        )
    );
</script>

<TailwindClasses
    classList={[
        'stroke-surface stroke-primary stroke-info stroke-warning stroke-danger stroke-success',
        'fill-surface fill-primary fill-info fill-warning fill-danger fill-success'
    ]}
/>

<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox={viewBox.join(' ')}
    class={svgClass}
    aria-label={ariaLabel}
    aria-hidden={ariaLabel ? false : true}
    role={ariaLabel ? 'img' : undefined}
>
    {@render children()}
</svg>
