import type { ClassValue } from 'clsx';
import type { ActionColor, Size } from '@lib/ui/atoms';
import type { InputVariant } from '@lib/ui/atoms/input';
import { getInputGroupContext } from '@lib/ui/atoms/input/InputGroup.svelte';
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
};

export type ButtonStyle = {
    class: string;
    disabled: boolean;
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

const sizeMods: Record<Size, string> = {
    xs: 'text-xs leading-none h-8 px-1.5',
    sm: 'text-sm leading-none h-10 px-2.25',
    md: 'text-md leading-none h-12 px-3',
    lg: 'text-lg leading-none h-14 px-4'
};

export const createButtonStyle = (config: () => ButtonStyleConfig): ButtonStyle => {
    const style = $derived<ButtonStyleConfig>({
        wide: false,
        showFocus: false,
        useGroupFocus: false,
        ...config()
    });

    const groupInfo = getInputGroupContext();

    const color = $derived(style.color ?? groupInfo?.color ?? 'primary');
    const size = $derived(style.size ?? groupInfo?.size ?? 'md');
    const variant = $derived(style.variant ?? groupInfo?.variant ?? 'filled');
    const disabled = $derived(style.disabled ?? groupInfo?.disabled ?? false);

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
            style.wide ? 'min-w-full justify-start' : 'w-fit',
            !disabled && (groupInfo ? ringClass('active', color) : 'active:scale-95'),
            disabled && '!opacity-30 !cursor-not-allowed',

            sizeMods[size],

            variant === 'filled' && [`bg-${color}`, `text-on-${color}`, `border-on-${color}`],
            variant === 'accent' && [`bg-${color}`, `text-on-${color}`, `border-on-${color}`, 'brightness-highlight'],
            variant === 'outline' && [`text-on-${color}`, `border-on-${color}`],
            variant === 'ghost' && [`text-on-${color}`, 'border-transparent'],
            !disabled && hoverClass(variant),

            style.class
        )
    );

    return {
        get class() {
            return cls;
        },
        get disabled() {
            return disabled;
        }
    };
};
