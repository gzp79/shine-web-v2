<script lang="ts" module>
    import type { ClassValue } from 'clsx';
    import type { Snippet } from 'svelte';
    import { cn } from '@lib/ui/utils';

    export const variantList = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'text', 'footnote', 'code', 'legend'] as const;
    export type Variant = (typeof variantList)[number];

    export const weightList = ['normal', 'emphasis', 'bold'] as const;
    export type Weight = (typeof weightList)[number];

    export type TypographyProps = {
        variant?: Variant;
        weight?: Weight;
        underline?: boolean;
        italic?: boolean;
        class?: ClassValue | null;

        element?: string;
        children: Snippet;
    };
</script>

<script lang="ts">
    let {
        variant = 'text',
        element = undefined,
        underline = false,
        weight = 'normal',
        italic = false,
        class: className,
        children
    }: TypographyProps = $props();

    const variantElement: Record<Variant, string> = {
        h1: 'h1',
        h2: 'h2',
        h3: 'h3',
        h4: 'h4',
        h5: 'h5',
        h6: 'h6',
        text: 'p',
        footnote: 'p',
        code: 'code',
        legend: 'legend'
    };

    const sharedHClasses = 'inline-flex gap-1 text-ellipsis text-pretty';
    const variantClasses: Record<Variant, string> = {
        h1: `text-4xl ${sharedHClasses}`,
        h2: `text-3xl ${sharedHClasses} `,
        h3: `text-2xl ${sharedHClasses} `,
        h4: `text-xl ${sharedHClasses}`,
        h5: `text-lg ${sharedHClasses}`,
        h6: `text-base ${sharedHClasses}`,
        text: 'text-base text-justify',
        footnote: 'text-sm',
        code: 'text-sm',
        legend: 'text-base'
    };

    const weightClasses: Record<Weight, string> = {
        normal: 'font-normal',
        emphasis: 'font-semibold',
        bold: 'font-bold'
    };

    let el = $derived(element ?? variantElement[variant]);
    let textClass = $derived(
        cn(variantClasses[variant], weightClasses[weight], underline && 'underline', italic && 'italic', className)
    );
</script>

<svelte:element this={el} class={textClass}>{@render children()}</svelte:element>
