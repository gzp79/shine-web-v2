<script module lang="ts">
    import type { WithElementRef } from 'bits-ui';
    import type { HTMLInputAttributes } from 'svelte/elements';
    import type { ActionColor, Size } from '@lib/ui/atoms';
    import type { InputVariant } from '@lib/ui/atoms/input';
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

        // requires special handling:
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

    const containerInfo = getContainerContext();
    const groupInfo = getInputGroupContext();

    const color = $derived(baseColor ?? groupInfo?.color ?? 'primary');
    const size = $derived(baseSize ?? groupInfo?.size ?? 'md');
    const variant = $derived(baseVariant ?? groupInfo?.variant ?? 'filled');

    const sizeMods: Record<Size, string> = {
        xs: 'text-xs leading-none h-8 px-2',
        sm: 'text-sm leading-none h-10 px-3',
        md: 'text-md leading-none h-12 px-4',
        lg: 'text-lg leading-none h-14 px-5'
    };

    const cls = $derived(
        cn(
            `gzp-${size}`,
            'rounded-lg border-2',
            `focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-on-${color}`,
            invalid && 'ring-2 ring-inset ring-on-danger',

            sizeMods[size],
            wide ? 'w-full' : 'w-fit',

            variant === 'filled' && [
                `bg-${color}`,
                `text-on-${color}`,
                `placeholder:text-${color}-2`,
                `border-on-${color}`,
                disabled ? '!opacity-30 !cursor-not-allowed' : 'hover:brightness-highlight'
            ],
            variant === 'outline' && [
                containerInfo && !baseColor ? `text-${containerInfo.fgColor}` : `text-on-${color}`,
                containerInfo && !baseColor
                    ? `placeholder:text-${containerInfo.fgColor2}`
                    : `placeholder:text-${color}-2`,
                containerInfo && !baseColor ? `border-${containerInfo.border}` : `border-on-${color}`,
                disabled ? '!opacity-30 !cursor-not-allowed' : 'hover:backdrop-brightness-highlight'
            ],
            variant === 'ghost' && [
                containerInfo && !baseColor ? `text-${containerInfo.fgColor}` : `text-on-${color}`,
                containerInfo && !baseColor
                    ? `placeholder:text-${containerInfo.fgColor2}`
                    : `placeholder:text-${color}-2`,
                'border-transparent',
                disabled ? '!opacity-30 !cursor-not-allowed' : 'hover:backdrop-brightness-highlight'
            ],

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
