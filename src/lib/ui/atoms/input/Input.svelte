<script module lang="ts">
    import type { WithElementRef } from 'bits-ui';
    import type { HTMLInputAttributes } from 'svelte/elements';
    import type { ActionColor, Size } from '@lib/ui/atoms';
    import type { InputVariant } from '@lib/ui/atoms/input';
    import { hoverClass, ringClass } from '@lib/ui/atoms/input/style.svelte';
    import { getContainerContext } from '@lib/ui/atoms/layouts/ContainerRoot.svelte';
    import { cn } from '@lib/ui/utils';
    import { getInputGroupContext } from './InputGroup.svelte';

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

    type InputBaseProps = WithElementRef<Omit<HTMLInputAttributes, 'type' | 'size'> & { type?: InputType }>;

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
        disabled = false,
        invalid = false,
        ref = $bindable(null),
        value = $bindable(),
        type = 'text',
        files = $bindable(),
        class: className,
        'data-slot': dataSlot = 'input',
        ...restProps
    }: InputProps = $props();

    const cntInfo = getContainerContext();
    const groupInfo = getInputGroupContext();

    const hasColor = $derived(!!(groupInfo?.color ?? baseColor));
    const color = $derived(groupInfo?.color ?? baseColor ?? 'primary');
    const size = $derived(groupInfo?.size ?? baseSize ?? 'md');
    const variant = $derived(groupInfo?.variant ?? baseVariant ?? 'filled');

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
            variant === 'outline' && [
                cntInfo && !hasColor ? `text-${cntInfo.fgColor}` : `text-on-${color}`,
                cntInfo && !hasColor ? `placeholder:text-${cntInfo.fgColor2}` : `placeholder:text-${color}-2`,
                cntInfo && !hasColor ? `border-${cntInfo.border}` : `border-on-${color}`
            ],
            variant === 'ghost' && [
                cntInfo && !hasColor ? `text-${cntInfo.fgColor}` : `text-on-${color}`,
                cntInfo && !hasColor ? `placeholder:text-${cntInfo.fgColor2}` : `placeholder:text-${color}-2`,
                'border-transparent'
            ],
            disabled ? '!opacity-30 !cursor-not-allowed' : hoverClass(variant),

            className
        )
    );
</script>

<input
    bind:this={ref}
    data-slot={dataSlot}
    class={cls}
    {type}
    {disabled}
    aria-invalid={invalid || undefined}
    bind:value
    {...restProps}
/>
