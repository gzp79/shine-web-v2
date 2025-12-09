<script module lang="ts">
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

    export type StackProps = HTMLAttributes<HTMLDivElement> & {
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
        alignment = 'stretch',
        justification = 'center',
        wrap = false,
        grow = false,
        margin = undefined,
        class: className,
        children,
        ...restProps
    }: StackProps = $props();

    let clsStack = $derived(
        cn(
            'flex',
            toResponsiveClass(direction, (m, dir) => (dir === 'row' ? [`${m}flex-row`] : [`${m}flex-col`])),
            toSpacingClasses(spacing, { all: 'gap', x: 'gap-x', y: 'gap-y' }),
            toResponsiveClass(alignment, (m, a) => `${m}items-${a}`),
            toResponsiveClass(justification, (m, j) => ` ${m}justify-${j}`),
            toSpacingClasses(margin, { all: 'm', x: 'mx', y: 'my' }),
            wrap && 'flex-wrap',
            grow && '[&>*]:flex-1',
            className
        )
    );
</script>

<div class={clsStack} {...restProps}>
    {@render children()}
</div>
