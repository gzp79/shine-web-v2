<script module lang="ts">
    import type { ClassValue } from 'clsx';
    import type { Snippet } from 'svelte';
    import { type ResponsiveSpacing, toSpacingClasses } from '@lib/ui/atoms';
    import { type Overflow } from '@lib/ui/atoms/layouts';
    import { cn } from '@lib/ui/utils';

    export type ContainerContentBaseProps = {
        padding?: ResponsiveSpacing;
        overflow?: Overflow;
    };

    export type ContainerContentProps = ContainerContentBaseProps & {
        dataSlot: string;
        class?: ClassValue | null;
        children: Snippet;
    };
</script>

<script lang="ts">
    let {
        padding = 4,
        overflow = 'hidden',
        dataSlot,
        class: className = undefined,
        children
    }: ContainerContentProps = $props();

    const scrollClass: Record<Overflow, string> = {
        y: 'overflow-y-auto overflow-x-hidden flex-1',
        x: 'overflow-y-hidden overflow-x-auto w-full',
        xy: 'overflow-auto flex-1',
        hidden: ''
    };

    let contentCls = $derived(
        cn(toSpacingClasses(padding, { all: 'p', x: 'px', y: 'py' }), scrollClass[overflow], className)
    );
</script>

<div data-slot={dataSlot} class={contentCls}>
    {@render children()}
</div>
