<script module lang="ts">
    import type { Snippet } from 'svelte';
    import type { AriaRole, ClassValue } from 'svelte/elements';
    import { type ActionColor, type ResponsiveSpacing, toSpacingClasses } from '@lib/ui/atoms';
    import { type LayoutWidth } from '@lib/ui/atoms/layouts';
    import { cn, createContext } from '@lib/ui/utils';

    export type ContainerRootProps = {
        color?: ActionColor;
        border?: boolean;
        shadow?: boolean;
        ghost?: boolean;
        width?: LayoutWidth;
        margin?: ResponsiveSpacing;
        'data-slot': string;
        role?: AriaRole;
        class?: ClassValue | null;
        children: Snippet;
    };

    export interface ContainerInfo {
        bgColor: string;
        fgColor: string;
        fgColor1: string;
        fgColor2: string;
        border: string;
        colorIndex: number;
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

    const colors = $derived.by(() => {
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

    setContainerContext({
        get fgColor() {
            return colors.fgColor;
        },
        get fgColor1() {
            return colors.fgColor1;
        },
        get fgColor2() {
            return colors.fgColor2;
        },
        get bgColor() {
            return colors.bgColor;
        },
        get border() {
            return colors.border;
        },
        colorIndex
    });

    const widthVariants: Record<LayoutWidth, string> = {
        fit: 'max-w-full w-fit',
        sm: 'w-[60%] lg:w-[60%]',
        md: 'w-[75%] lg:w-[70%]',
        lg: 'w-[99%] lg:w-[90%]',
        full: 'w-full'
    };

    const cls = $derived(
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
