<script module lang="ts">
    import { Switch as SwitchPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
    import type { ClassValue } from 'clsx';
    import type { ActionColor, Size } from '@lib/ui/atoms';
    import { getInputGroupContext } from '@lib/ui/atoms/input/InputGroup.svelte';
    import { getFieldContext } from '@lib/ui/atoms/input/Field.svelte';
    import { cn } from '@lib/ui/utils';

    export type SwitchProps = WithoutChildrenOrChild<SwitchPrimitive.RootProps> & {
        color?: ActionColor;
        size?: Size;
        //variant?: InputVariant;
        disabled?: boolean;
        fieldControl?: boolean;
        class?: ClassValue;
    };

    const transition = 'transition-all duration-100 easy-in-out';

    const btnSize: Record<Size, string> = {
        xs: 'w-6 h-3.5',
        sm: 'w-8 h-4',
        md: 'w-10 h-5',
        lg: 'w-12 h-6'
    };

    const thumbSize: Record<Size, string> = {
        xs: 'w-2 h-2 translate-x-[2px] translate-y-[2px]',
        sm: 'w-2.5 h-2.5 translate-x-[2px] translate-y-[2px]',
        md: 'w-3.5 h-3.5 translate-x-[2.5px] translate-y-[2px]',
        lg: 'w-4 h-4 translate-x-[3px] translate-y-[3px]'
    };

    const thumbColorOn: Record<ActionColor, string> = {
        primary: 'data-[state=checked]:bg-primary-2 data-[state=checked]:border-on-primary',
        secondary: 'data-[state=checked]:bg-secondary-2 data-[state=checked]:border-on-secondary',
        info: 'data-[state=checked]:bg-info-2 data-[state=checked]:border-on-info',
        warning: 'data-[state=checked]:bg-warning-2 data-[state=checked]:border-on-warning',
        danger: 'data-[state=checked]:bg-danger-2 data-[state=checked]:border-on-danger',
        success: 'data-[state=checked]:bg-success-2 data-[state=checked]:border-on-success'
    };

    const thumbColorOff: Record<ActionColor, string> = {
        primary: 'data-[state=unchecked]:bg-primary data-[state=unchecked]:border-primary-2',
        secondary: 'data-[state=unchecked]:bg-secondary data-[state=unchecked]:border-secondary-2',
        info: 'data-[state=unchecked]:bg-info data-[state=unchecked]:border-info-2',
        warning: 'data-[state=unchecked]:bg-warning data-[state=unchecked]:border-warning-2',
        danger: 'data-[state=unchecked]:bg-danger data-[state=unchecked]:border-danger-2',
        success: 'data-[state=unchecked]:bg-success data-[state=unchecked]:border-success-2'
    };

    const thumbTranslate: Record<Size, string> = {
        xs: 'data-[state=checked]:translate-x-[12px]',
        sm: 'data-[state=checked]:translate-x-[18px]',
        md: 'data-[state=checked]:translate-x-[22px]',
        lg: 'data-[state=checked]:translate-x-[27px]'
    };
</script>

<script lang="ts">
    let {
        color: baseColor = 'primary',
        size: baseSize = 'md',
        //variant: baseVariant = 'filled',
        disabled: baseDisabled = false,
        fieldControl = false,
        class: className,
        checked = $bindable(false),
        id,
        ...restProps
    }: SwitchProps = $props();

    const ctx = getInputGroupContext();
    const fieldCtx = getFieldContext();

    const generatedId = $props.id();
    const resolvedId = $derived(id ?? (fieldControl ? generatedId : undefined));

    $effect(() => {
        if (fieldControl && fieldCtx && resolvedId) {
            fieldCtx.setFieldFor(resolvedId);
        }
    });

    const color = $derived(baseColor ?? ctx?.color ?? 'primary');
    const size = $derived(baseSize ?? ctx?.size ?? 'md');
    //const variant = $derived(baseVariant ?? ctx?.variant ?? 'filled');
    const disabled = $derived(baseDisabled || ctx?.disabled || false);

    let btnCls = $derived(
        cn(
            `relative rounded-full bg-${color} border border-on-${color}`,
            btnSize[size],
            disabled && 'opacity-30',
            transition
        )
    );

    let thumbClass = $derived(
        cn(
            'absolute top-0 left-0 block rounded-full border-[2px] pointer-events-none',
            thumbSize[size],
            thumbColorOn[color],
            thumbColorOff[color],
            thumbTranslate[size],
            transition
        )
    );
</script>

<SwitchPrimitive.Root bind:checked data-slot="switch" id={resolvedId} class={btnCls} {disabled} {...restProps}>
    <SwitchPrimitive.Thumb data-slot="switch-thumb" class={thumbClass} />
</SwitchPrimitive.Root>
