<script module lang="ts">
    import type { WithElementRef } from 'bits-ui';
    import type { HTMLInputAttributes } from 'svelte/elements';
    import type { ActionColor, Size } from '@lib/ui/atoms';
    import { getContainerContext } from '@lib/ui/atoms/layouts/ContainerRoot.svelte';
    import type { InputVariant } from '@lib/ui/input';
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
        color: baseColor = undefined,
        variant = 'filled',
        size = 'md',
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

    let containerInfo = getContainerContext();
    let color = $derived(baseColor ?? 'primary');

    const sizeMods: Record<Size, string> = {
        xs: 'text-xs leading-none px-2 py-1.5',
        sm: 'text-sm leading-none px-3 py-2',
        md: 'text-md leading-none px-4 py-3',
        lg: 'text-lg leading-none px-5 py-4'
    };

    let cls = $derived(
        cn(
            'rounded-lg border-2',

            'focus-visible:outline-none',
            'focus-visible:ring-2',
            'focus-visible:ring-inset',
            `focus-visible:ring-${color}-2`,

            invalid && 'aria-invalid !border-on-danger',

            sizeMods[size],
            wide ? 'w-full' : 'w-fit',

            variant === 'filled' && [
                `bg-${color}`,
                `text-on-${color}`,
                `placeholder:text-${color}-2`,
                `border-on-${color}`,
                disabled ? '!opacity-30 !cursor-not-allowed' : 'hover:highlight'
            ],
            variant === 'outline' && [
                containerInfo && !baseColor ? `text-${containerInfo.fgColor}` : `text-on-${color}`,
                containerInfo && !baseColor
                    ? `placeholder:text-${containerInfo.fgColor2}`
                    : `placeholder:text-${color}-2`,
                containerInfo && !baseColor ? `border-${containerInfo.border}` : `border-on-${color}`,
                disabled ? '!opacity-30 !cursor-not-allowed' : 'hover:highlight-backdrop'
            ],
            variant === 'ghost' && [
                containerInfo && !baseColor ? `text-${containerInfo.fgColor}` : `text-on-${color}`,
                containerInfo && !baseColor
                    ? `placeholder:text-${containerInfo.fgColor2}`
                    : `placeholder:text-${color}-2`,
                'border-transparent',
                disabled ? '!opacity-30 !cursor-not-allowed' : 'hover:highlight-backdrop'
            ],

            className
        )
    );
</script>

<input bind:this={ref} data-slot={dataSlot} class={cls} {type} bind:value {...restProps} />
