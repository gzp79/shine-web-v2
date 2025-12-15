<script module lang="ts">
    import type { ButtonRootProps } from 'bits-ui';
    import { Button } from 'bits-ui';
    import { type ActionColor, type Size } from '@lib/ui/atoms';
    import { type InputVariant } from '@lib/ui/atoms/input';
    import { type ContainerInfo, getContainerContext } from '@lib/ui/atoms/layouts/ContainerRoot.svelte';
    import { cn } from '@lib/ui/utils';

    export type ButtonStyleParams = {
        color?: ActionColor;
        wide?: boolean;
        size?: Size;
        variant?: InputVariant;
        disabled?: boolean;
        highlight?: boolean;
    };

    export type ButtonProps = ButtonRootProps & ButtonStyleParams;

    export const getStyle = (style: ButtonStyleParams, containerInfo?: ContainerInfo): string => {
        const {
            color: baseColor = undefined,
            variant = 'filled',
            size = 'md',
            wide = false,
            disabled = false,
            highlight = false
        } = style;

        const color = baseColor ?? 'primary';

        const sizeMods: Record<Size, string> = {
            xs: 'text-xs leading-none h-8 px-1.5',
            sm: 'text-sm leading-none h-10 px-2.25',
            md: 'text-md leading-none h-12 px-3',
            lg: 'text-lg leading-none h-14 px-4'
        };

        return cn(
            'border-2 rounded-full',
            'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap outline-none text-center',
            'focus-visible:ring-2 focus-visible:ring-inset',
            `focus-visible:ring-${color}-2`,
            wide ? 'min-w-full justify-around' : 'w-fit',
            !disabled && 'active:scale-95',
            disabled && '!opacity-30 !cursor-not-allowed',
            !disabled && highlight && 'highlight',

            sizeMods[size],

            variant === 'filled' && [
                `bg-${color}`,
                `text-on-${color}`,
                `border-on-${color}`,
                !disabled && 'hover:highlight'
            ],
            variant === 'outline' && [
                containerInfo && !baseColor ? `text-${containerInfo.fgColor}` : `text-on-${color}`,
                containerInfo && !baseColor ? `border-${containerInfo.border}` : `border-on-${color}`,
                !disabled && 'hover:highlight-backdrop'
            ],
            variant === 'ghost' && [
                containerInfo && !baseColor ? `text-${containerInfo.fgColor}` : `text-on-${color}`,
                'border-transparent',
                !disabled && 'hover:highlight-backdrop'
            ]
        );
    };
</script>

<script lang="ts">
    let {
        color: baseColor = undefined,
        variant = 'filled',
        size = 'md',
        wide = false,
        disabled = false,
        highlight = false,
        children,
        ...restProps
    }: ButtonProps = $props();

    let containerInfo = getContainerContext();
    let cls = $derived(getStyle({ color: baseColor, variant, size, wide, disabled, highlight }, containerInfo));
</script>

<Button.Root {disabled} class={cls} {...restProps}>
    {@render children?.()}
</Button.Root>
