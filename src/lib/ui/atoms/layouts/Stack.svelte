<script module lang="ts">
    import type { WithElementRef } from 'bits-ui';
    import { type Snippet } from 'svelte';
    import type { HTMLAttributes } from 'svelte/elements';
    import { type ResponsiveProp, type ResponsiveSpacing, toResponsiveClass, toSpacingClasses } from '@lib/ui/atoms';
    import { cn } from '@lib/ui/utils';

    export const directionList = ['row', 'column'] as const;
    export type Direction = (typeof directionList)[number];

    export const alignmentList = ['start', 'center', 'end', 'stretch'] as const;
    export type Alignment = (typeof alignmentList)[number];

    export const justificationList = ['start', 'center', 'end', 'between', 'around', 'evenly'] as const;
    export type Justification = (typeof justificationList)[number];

    export type StackProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
        direction?: ResponsiveProp<Direction>;
        spacing?: ResponsiveSpacing;
        alignment?: ResponsiveProp<Alignment>;
        justification?: ResponsiveProp<Justification>;
        wrap?: boolean;
        grow?: boolean;
        margin?: ResponsiveSpacing;
        children: Snippet;
    };
</script>

<script lang="ts">
    let {
        direction = 'column',
        spacing = 2,
        alignment = undefined,
        justification = undefined,
        wrap = false,
        grow = false,
        margin = undefined,
        class: className,
        children,
        ref = $bindable(null),
        ...restProps
    }: StackProps = $props();

    const clsStack = $derived(
        cn(
            'flex',
            toResponsiveClass(direction, (m, dir) => (dir === 'row' ? [`${m}flex-row`] : [`${m}flex-col`])),
            toSpacingClasses(spacing, { all: 'gap', x: 'gap-x', y: 'gap-y' }),
            alignment && toResponsiveClass(alignment, (m, a) => `${m}items-${a}`),
            justification && toResponsiveClass(justification, (m, j) => `${m}justify-${j}`),
            toSpacingClasses(margin, { all: 'm', x: 'mx', y: 'my' }),
            wrap && 'flex-wrap',
            grow && '[&>*]:flex-1',
            className
        )
    );
</script>

<div bind:this={ref} class={clsStack} {...restProps}>
    {@render children()}
</div>
