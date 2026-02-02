<script module lang="ts">
    import type { Snippet } from 'svelte';
    import type { AriaRole, ClassValue } from 'svelte/elements';
    import { type ActionColor, type ResponsiveSpacing, toSpacingClasses } from '@lib/ui/atoms';
    import { type LayoutWidth, clampColorIndex, nextColorIndex } from '@lib/ui/atoms/layouts';
    import { cn, createContext } from '@lib/ui/utils';

    export type ContainerRootProps = {
        color?: ActionColor;
        nestingLevel?: number;
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
        color: ActionColor;
        nestingLevel: number;
        colorIndex: number;
    }
    const { tryGet: getContainerContext, set: setContainerContext } = createContext<ContainerInfo>('Container');
    export { getContainerContext };
</script>

<script lang="ts">
    let {
        color: baseColor = undefined,
        border = true,
        shadow = true,
        ghost = false,
        width = 'fit',
        margin = undefined,
        class: className = undefined,
        nestingLevel: baseLevel = undefined,
        children,
        ...restProps
    }: ContainerRootProps = $props();

    const colorRotation = ['container', 'sub-container', 'surface'];

    let parentContext = getContainerContext();

    let nestingLevel: number = $derived(baseLevel ?? (parentContext?.nestingLevel ?? -1) + 1);
    let parentColorIndex: number = $derived(clampColorIndex(baseLevel ?? parentContext?.colorIndex ?? 0));
    let colorIndex: number = $derived(nextColorIndex(parentColorIndex));

    const color = $derived(baseColor === undefined ? (colorRotation[colorIndex] as ActionColor) : baseColor);

    setContainerContext({
        get color() {
            return color;
        },
        get nestingLevel() {
            return nestingLevel;
        },
        get colorIndex() {
            return colorIndex;
        }
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
            border && `border border-on-${color}`,
            !ghost && `bg-${color}`,
            `text-on-${color}`,
            shadow && `shadow-md shadow-on-${color}`,
            'overflow-clip',
            toSpacingClasses(margin, { all: 'm', x: 'mx', y: 'my' }),
            className
        )
    );
</script>

<div class={cls} {...restProps}>
    {@render children()}
</div>
