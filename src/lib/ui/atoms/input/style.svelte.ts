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

// On use make sure the generated classes are exported in the TailwindClasses config
export function ringClass(prefix: string, color: string): string {
    return ['ring-2 ', 'ring-inset', `ring-on-${color}`].map((cls) => `${prefix}:${cls}`).join(' ');
}

export function hoverClass(variant: InputVariant): string {
    if (variant === 'filled' || variant === 'accent') {
        return 'hover:brightness-highlight';
    } else if (variant === 'outline' || variant === 'ghost') {
        return 'hover:backdrop-brightness-highlight';
    } else {
        return '';
    }
}

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

    const hasColor = $derived(!!(groupInfo?.color ?? style.color));
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
        [
            style.useGroupFocus ? 'group-' : '', //
            'focus',
            style.showFocus ? '' : '-visible'
        ].join('')
    );

    const cls = $derived(
        cn(
            'border-2',
            groupInfo ? 'rounded-md' : 'rounded-full',
            'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap outline-none text-center',
            ringClass(focusRing, color),
            style.wide ? 'min-w-full justify-around' : 'w-fit',
            !style.disabled && (groupInfo ? ringClass('active', color) : 'active:scale-95'),
            style.disabled && '!opacity-30 !cursor-not-allowed',

            sizeMods[size],

            variant === 'filled' && [`bg-${color}`, `text-on-${color}`, `border-on-${color}`],
            variant === 'accent' && [`bg-${color}`, `text-on-${color}`, `border-on-${color}`, 'brightness-highlight'],

            variant === 'outline' && [
                cntInfo && !hasColor ? `text-${cntInfo.fgColor}` : `text-on-${color}`,
                cntInfo && !hasColor ? `border-${cntInfo.border}` : `border-on-${color}`
            ],
            variant === 'ghost' && [
                cntInfo && !hasColor ? `text-${cntInfo.fgColor}` : `text-on-${color}`,
                'border-transparent'
            ],
            !style.disabled && hoverClass(variant),

            style.class
        )
    );

    return {
        get class() {
            return cls;
        }
    };
};
