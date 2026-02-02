<script module lang="ts">
    import type { HTMLInputAttributes } from 'svelte/elements';
    import type { ActionColor, Size } from '@lib/ui/atoms';
    import type { InputVariant } from '@lib/ui/atoms/input';
    import { getInputGroupContext } from '@lib/ui/atoms/input/InputGroup.svelte';
    import { hoverClass, ringClass } from '@lib/ui/atoms/input/style.svelte';
    import { cn } from '@lib/ui/utils';

    export const inputTypeList = [
        'text',
        'number',
        'password',
        'search',
        'email',
        'url',
        'tel',

        'date',
        //'month',  - not supported in safari, firefox
        //'week', - not supported in safari, firefox
        'time',
        'datetime-local'

        // requires dedicated components:
        //'checkbox',
        //'radio',
        //'file',
        //'color'
    ];
    export type InputType = (typeof inputTypeList)[number];

    type InputBaseProps = Omit<HTMLInputAttributes, 'type' | 'size'> & { type?: InputType };

    export type InputProps = InputBaseProps & {
        color?: ActionColor;
        variant?: InputVariant;
        size?: Size;
        wide?: boolean;
        disabled?: boolean;
        invalid?: boolean;
    };
</script>

<script lang="ts">
    let {
        color: baseColor,
        variant: baseVariant,
        size: baseSize,
        wide = false,
        disabled: baseDisabled,
        invalid = false,
        value = $bindable(),
        type = 'text',
        files = $bindable(),
        class: className,
        'data-slot': dataSlot = 'input',
        ...restProps
    }: InputProps = $props();

    const ctx = getInputGroupContext();

    // Precedence: explicit prop > InputGroupContext (from Field or InputGroup) > default
    const color = $derived(baseColor ?? ctx?.color ?? 'primary');
    const size = $derived(baseSize ?? ctx?.size ?? 'md');
    const variant = $derived(baseVariant ?? ctx?.variant ?? 'filled');
    const disabled = $derived(baseDisabled || ctx?.disabled || false);

    const sizeMods: Record<Size, string> = {
        xs: 'text-xs leading-none h-8 px-2',
        sm: 'text-sm leading-none h-10 px-3',
        md: 'text-md leading-none h-12 px-4',
        lg: 'text-lg leading-none h-14 px-5'
    };

    const cls = $derived(
        cn(
            'rounded-lg border-2',
            ringClass('focus-visible', color),
            invalid && 'ring-2 ring-inset ring-on-danger',

            sizeMods[size],
            wide ? 'w-full' : 'w-fit',

            variant === 'filled' && [
                `bg-${color}`,
                `text-on-${color}`,
                `placeholder:text-${color}-2`,
                `border-on-${color}`
            ],
            variant === 'accent' && [
                `bg-${color}`,
                `text-on-${color}`,
                `placeholder:text-${color}-2`,
                `border-on-${color}`,
                'brightness-highlight'
            ],
            variant === 'outline' && [`text-on-${color}`, `placeholder:text-on-${color}-2`, `border-on-${color}`],
            variant === 'ghost' && [`text-on-${color}`, `placeholder:text-${color}-2`, 'border-transparent'],
            disabled ? '!opacity-30 !cursor-not-allowed' : hoverClass(variant),

            className
        )
    );
</script>

<input
    data-slot={dataSlot}
    class={cls}
    {type}
    {disabled}
    aria-invalid={invalid || undefined}
    bind:value
    {...restProps}
/>
