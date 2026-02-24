<script module lang="ts">
    import type { ClassValue } from 'clsx';
    import type { Snippet } from 'svelte';
    import type { HTMLAttributes } from 'svelte/elements';
    import { type AriaLive, type ResponsiveSpacing, toSpacingClasses } from '@lib/ui/atoms';
    import { type Overflow, scrollShadow } from '@lib/ui/atoms/layouts';
    import { getContainerContext } from '@lib/ui/atoms/layouts/ContainerRoot.svelte';
    import { cn } from '@lib/ui/utils';

    export type T = HTMLAttributes<HTMLDivElement> & { aaa: string };

    export type ContainerContentProps = {
        padding?: ResponsiveSpacing;
        overflow?: Overflow;
        scrollShadow?: boolean;
        'data-slot': string;
        'aria-live'?: AriaLive;
        role?: string;
        class?: ClassValue | null;
        children: Snippet;
    };
</script>

<script lang="ts">
    let {
        padding = 4,
        overflow = 'hidden',
        scrollShadow: enableScrollShadow = false,
        class: className = undefined,
        children,
        ...restProps
    }: ContainerContentProps = $props();

    let containerContext = getContainerContext();
    if (!containerContext) {
        throw new Error('ContainerContent must be used within a ContainerRoot');
    }

    const scrollClass: Record<Overflow, string> = {
        y: 'overflow-y-auto overflow-x-hidden flex-1',
        x: 'overflow-y-hidden overflow-x-auto w-full',
        xy: 'overflow-auto flex-1',
        hidden: ''
    };

    const contentCls = $derived(
        cn(
            'relative w-full',
            toSpacingClasses(padding, { all: 'p', x: 'px', y: 'py' }),
            scrollClass[overflow],
            className
        )
    );

    const shadowColor = $derived(`var(--color-on-${containerContext.color})`);
</script>

<div
    class={contentCls}
    {@attach enableScrollShadow && overflow !== 'hidden' && scrollShadow(overflow, shadowColor)}
    {...restProps}
>
    {@render children()}
</div>
