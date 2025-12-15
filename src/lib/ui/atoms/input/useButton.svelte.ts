import type { Action } from 'svelte/action';
import type { ActionColor, Size } from '@lib/ui/atoms';
import type { InputVariant } from '@lib/ui/atoms/input';
import { getContainerContext } from '@lib/ui/atoms/layouts/ContainerRoot.svelte';
import { cn } from '@lib/ui/utils';

export type UseButtonParams = {
    color?: ActionColor;
    wide?: boolean;
    size?: Size;
    variant?: InputVariant;
    disabled?: boolean;
    highlight?: boolean;
};

export const useButtonStyle: Action = (node: HTMLElement, params?: UseButtonParams) => {
    const {
        color: baseColor,
        wide = false,
        size = 'md',
        variant = 'filled',
        disabled = false,
        highlight = false
    } = params ?? {};

    const containerInfo = getContainerContext();
    const color = $derived(baseColor ?? 'primary');

    const sizeMods: Record<Size, string> = {
        xs: 'text-xs leading-none h-8 px-1.5',
        sm: 'text-sm leading-none h-10 px-2.25',
        md: 'text-md leading-none h-12 px-3',
        lg: 'text-lg leading-none h-14 px-4'
    };

    /*let linkAction = $derived.by(() => {
        switch (getLinkType(href)) {
            case 'hash':
            case 'external':
            case 'protocol':
                return { 'data-sveltekit-reload': true as const };
            default:
                return restProps;
        }
    });*/

    const cls = $derived(
        cn(
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
        )
    );

    node.classList.add(...cls.split(' '));
};
