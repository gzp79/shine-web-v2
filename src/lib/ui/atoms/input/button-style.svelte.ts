import type { ClassValue } from 'clsx';
import type { ActionColor, Size } from '@lib/ui/atoms';
import type { InputVariant } from '@lib/ui/atoms/input';
import { getInputGroupContext } from '@lib/ui/atoms/input/InputGroup.svelte';
import { getContainerContext } from '@lib/ui/atoms/layouts/ContainerRoot.svelte';
import { cn } from '@lib/ui/utils';

export type ButtonStyleConfig = {
    color?: ActionColor;
    wide?: boolean;
    size?: Size;
    variant?: InputVariant;
    disabled?: boolean;
    class?: ClassValue;
    showFocus?: boolean;
    useGroupFocus?: boolean;
    ignoreContainerContext?: boolean;
};

export type ButtonStyle = {
    class: string;
};

export const createButtonStyle = (config: () => ButtonStyleConfig): ButtonStyle => {
    const style = $derived<ButtonStyleConfig>({
        variant: 'filled',
        size: 'md',
        wide: false,
        disabled: false,
        showFocus: false,
        useGroupFocus: false,
        ignoreContainerContext: false,
        ...config()
    });

    const cntInfo = $derived(style.ignoreContainerContext ? undefined : getContainerContext());
    const groupInfo = getInputGroupContext();

    const color = $derived(groupInfo?.color ?? style.color ?? 'primary');
    const size = $derived(groupInfo?.size ?? style.size ?? 'md');
    const variant = $derived(groupInfo?.variant ?? style.variant ?? 'filled');

    const sizeMods: Record<Size, string> = {
        xs: 'text-xs leading-none h-8 px-1.5',
        sm: 'text-sm leading-none h-10 px-2.25',
        md: 'text-md leading-none h-12 px-3',
        lg: 'text-lg leading-none h-14 px-4'
    };

    const focusRing = $derived(
        ['ring-2 ', 'ring-inset', `ring-on-${color}`]
            .map((cls) => (style.showFocus ? `focus:${cls}` : `focus-visible:${cls}`))
            .map((cls) => (style.useGroupFocus ? `group-${cls}` : cls))
    );

    const cls = $derived(
        cn(
            'border-2',
            groupInfo ? 'rounded-md' : 'rounded-full',
            'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap outline-none text-center',
            focusRing,
            style.wide ? 'min-w-full justify-around' : 'w-fit',
            !style.disabled &&
                (groupInfo ? `active:ring-2 active:ring-inset active:ring-on-${color}` : 'active:scale-95'),
            style.disabled && '!opacity-30 !cursor-not-allowed',

            sizeMods[size],

            variant === 'filled' && [
                `bg-${color}`,
                `text-on-${color}`,
                `border-on-${color}`,
                !style.disabled && 'hover:brightness-highlight'
            ],
            variant === 'outline' && [
                cntInfo && !style.color ? `text-${cntInfo.fgColor}` : `text-on-${color}`,
                cntInfo && !style.color ? `border-${cntInfo.border}` : `border-on-${color}`,
                !style.disabled && 'hover:backdrop-brightness-highlight'
            ],
            variant === 'ghost' && [
                cntInfo && !style.color ? `text-${cntInfo.fgColor}` : `text-on-${color}`,
                'border-transparent',
                !style.disabled && 'hover:backdrop-brightness-highlight'
            ],

            style.class
        )
    );

    return {
        get class() {
            return cls;
        }
    };
};
