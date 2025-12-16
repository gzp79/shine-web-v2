<script module lang="ts">
    import type { Snippet } from 'svelte';
    import type { ClassValue } from 'svelte/elements';
    import { type ActionColor, type ResponsiveSpacing, toSpacingClasses } from '@lib/ui/atoms';
    import { type Width } from '@lib/ui/atoms/layouts';
    import { cn, createContext } from '@lib/ui/utils';

    export type ContainerRootProps = {
        color?: ActionColor;
        border?: boolean;
        shadow?: boolean;
        ghost?: boolean;
        width?: Width;
        margin?: ResponsiveSpacing;
        'data-slot': string;
        class?: ClassValue | null;
        children: Snippet;
    };

    export interface ContainerInfo {
        bgColor: string;
        fgColor: string;
        fgColor1: string;
        fgColor2: string;
        border: string;
    }
    const [getContainerContext, setContainerContext] = createContext<ContainerInfo>('Container');
    export { getContainerContext };

    const [getContainerNestingLevel, setContainerNestingLevel] = createContext<number>('ContainerNestingLevel');
    const [getContainerColorIndex, setContainerColorIndex] = createContext<number>('ContainerColorIndex');
</script>

<script lang="ts">
    let {
        color = undefined,
        border = true,
        shadow = true,
        ghost = false,
        width = 'fit',
        margin = undefined,
        class: className = undefined,
        children,
        ...restProps
    }: ContainerRootProps = $props();

    const colorRotation = ['container', 'sub-container', 'surface'];

    let nestingLevel: number = (getContainerNestingLevel() ?? -1) + 1;
    setContainerNestingLevel(nestingLevel);

    let colorIndex: number = ((getContainerColorIndex() ?? -1) + 1) % colorRotation.length;
    setContainerColorIndex(colorIndex);

    let colors = $derived.by(() => {
        if (color) {
            return {
                fgColor: 'on-' + color,
                fgColor1: color + '-1',
                fgColor2: color + '-2',
                bgColor: color,
                border: 'on-' + color
            };
        } else {
            return {
                fgColor: 'on-' + colorRotation[colorIndex],
                fgColor1: 'primary-1',
                fgColor2: 'primary-2',
                bgColor: colorRotation[colorIndex],
                border: 'on-' + colorRotation[(colorIndex + colorRotation.length - 1) % colorRotation.length]
            };
        }
    });

    // convert props into state, so it can be updated and children reactively
    let context = $state({} as ContainerInfo);
    $effect(() => {
        context.fgColor = colors.fgColor;
        context.fgColor1 = colors.fgColor1;
        context.fgColor2 = colors.fgColor2;
        context.bgColor = colors.bgColor;
        context.border = colors.border;
    });
    setContainerContext(context);

    const widthVariants: Record<Width, string> = {
        fit: 'max-w-full w-fit',
        small: 'w-[75%] lg:w-[60%]',
        big: 'w-[95%] lg:w-[80%]',
        full: 'w-full'
    };

    let cls = $derived(
        cn(
            'rounded-lg',
            'min-h-0 min-w-0',
            'flex flex-col',
            widthVariants[width],
            border && `border border-${colors.border}`,
            !ghost && `bg-${colors.bgColor}`,
            `text-${colors.fgColor}`,
            shadow && `shadow-md shadow-${colors.fgColor}`,
            'overflow-clip',
            toSpacingClasses(margin, { all: 'm', x: 'mx', y: 'my' }),
            className
        )
    );
</script>

<div class={cls} {...restProps}>
    {@render children()}
</div>
