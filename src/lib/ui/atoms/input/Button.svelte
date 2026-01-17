<script module lang="ts">
    import type { ButtonRootProps } from 'bits-ui';
    import { Button } from 'bits-ui';
    import type { ClassValue } from 'clsx';
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
        class?: ClassValue;
    };

    export type ButtonProps = ButtonRootProps & ButtonStyleParams;

    export const getButtonStyle = (
        style: ButtonStyleParams,
        containerInfo: 'auto' | 'root' | ContainerInfo
    ): string => {
        const {
            color: baseColor = undefined,
            variant = 'filled',
            size = 'md',
            wide = false,
            disabled = false,
            highlight = false,
            class: className
        } = style;

        const cntInfo =
            containerInfo === 'auto' ? getContainerContext() : containerInfo === 'root' ? null : containerInfo;
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
                !disabled && 'hover:brightness-highlight'
            ],
            variant === 'outline' && [
                cntInfo && !baseColor ? `text-${cntInfo.fgColor}` : `text-on-${color}`,
                cntInfo && !baseColor ? `border-${cntInfo.border}` : `border-on-${color}`,
                !disabled && 'hover:backdrop-brightness-highlight'
            ],
            variant === 'ghost' && [
                cntInfo && !baseColor ? `text-${cntInfo.fgColor}` : `text-on-${color}`,
                'border-transparent',
                !disabled && 'hover:backdrop-brightness-highlight'
            ],

            className
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
        class: className,
        children,
        ...restProps
    }: ButtonProps = $props();

    let cls = $derived(
        getButtonStyle(
            {
                color: baseColor,
                variant,
                size,
                wide,
                disabled,
                highlight,
                class: className
            },
            'auto'
        )
    );
</script>

<Button.Root {disabled} class={cls} {...restProps}>
    {@render children?.()}
</Button.Root>
