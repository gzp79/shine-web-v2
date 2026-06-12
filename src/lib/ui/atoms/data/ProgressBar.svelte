<script module lang="ts">
    import type { ClassValue } from 'clsx';
    import type { ActionColor, Size } from '@lib/ui/atoms';
    import { cn } from '@lib/ui/utils';

    export type ProgressBarDisplay = 'none' | 'percent' | 'label';

    export type ProgressBarProps = {
        value: number;
        color?: ActionColor;
        size?: Size;
        wide?: boolean;
        display?: ProgressBarDisplay;
        label?: string;
        class?: ClassValue;
    };

    const sizeMap: Record<Size, { height: string; text: string }> = {
        xs: { height: 'h-4', text: 'text-xs' },
        sm: { height: 'h-6', text: 'text-sm' },
        md: { height: 'h-8', text: 'text-md' },
        lg: { height: 'h-10', text: 'text-lg' }
    };
</script>

<script lang="ts">
    const {
        value,
        color = 'primary',
        size = 'md',
        wide = false,
        display = 'percent',
        label,
        class: className
    }: ProgressBarProps = $props();

    const clamped = $derived(Math.min(100, Math.max(0, value)));

    const trackClass = $derived(
        cn(
            'relative overflow-hidden rounded-full border-2',
            `bg-${color}`,
            `border-on-${color}`,
            sizeMap[size].height,
            wide ? 'w-full' : 'w-64',
            className
        )
    );

    const fillClass = $derived(
        cn('absolute inset-y-0 left-0 h-full transition-[width] duration-500 ease-in-out', `bg-${color}-2`)
    );

    const labelBaseClass = $derived(
        cn(
            'absolute inset-0 flex items-center justify-center gap-2 select-none pointer-events-none',
            sizeMap[size].text
        )
    );

    const labelText = $derived(display === 'label' && label ? `${label}  ${clamped}%` : `${clamped}%`);
</script>

<div
    role="progressbar"
    aria-label={label}
    aria-valuenow={clamped}
    aria-valuemin={0}
    aria-valuemax={100}
    class={trackClass}
>
    <div class={fillClass} style="width: {clamped}%"></div>
    {#if display !== 'none'}
        <!-- text over the filled portion -->
        <span class={cn(labelBaseClass, `text-on-${color}-2`)} style="clip-path: inset(0 {100 - clamped}% 0 0)"
            >{labelText}</span
        >
        <!-- text over the unfilled portion -->
        <span class={cn(labelBaseClass, `text-on-${color}`)} style="clip-path: inset(0 0 0 {clamped}%)"
            >{labelText}</span
        >
    {/if}
</div>
