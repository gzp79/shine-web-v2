<script module lang="ts">
    import type { ButtonRootProps } from 'bits-ui';
    import { Button } from 'bits-ui';
    import type { ClassValue } from 'clsx';
    import { type ActionColor, type Size } from '@lib/ui/atoms';
    import { type InputVariant } from '@lib/ui/atoms/input';
    import { type ContainerInfo, getContainerContext } from '@lib/ui/atoms/layouts/ContainerRoot.svelte';
    import { cn } from '@lib/ui/utils';

    export type ButtonStyleProps = {
        color?: ActionColor;
        wide?: boolean;
        size?: Size;
        variant?: InputVariant;
        disabled?: boolean;
        class?: ClassValue;
        showFocus?: boolean;
        useGroupFocus?: boolean;
    };

    export type ButtonProps = ButtonRootProps & ButtonStyleProps;

    export const getButtonStyle = (style: ButtonStyleProps, containerInfo: 'auto' | 'root' | ContainerInfo): string => {
        const {
            color: baseColor = undefined,
            variant = 'filled',
            size = 'md',
            wide = false,
            disabled = false,
            showFocus = false,
            useGroupFocus = false,
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

        const groupFocus = ['ring-2 ', 'ring-inset', `ring-on-${color}`]
            .map((cls) => (showFocus ? `focus:${cls}` : `focus-visible:${cls}`))
            .map((cls) => (useGroupFocus ? `group-${cls}` : cls));

        return cn(
            'border-2 rounded-full',
            'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap outline-none text-center',
            groupFocus,
            wide ? 'min-w-full justify-around' : 'w-fit',
            !disabled && 'active:scale-95',
            disabled && '!opacity-30 !cursor-not-allowed',

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
    let { color, variant, size, wide, disabled, class: className, children, ...restProps }: ButtonProps = $props();

    let cls = $derived(
        getButtonStyle(
            {
                color,
                variant,
                size,
                wide,
                disabled,
                class: className
            },
            'auto'
        )
    );
</script>

<Button.Root {disabled} class={cls} {...restProps}>
    {@render children?.()}
</Button.Root>
