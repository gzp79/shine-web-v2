<script lang="ts" module>
    import type { ClassValue } from 'clsx';
    import type { Snippet } from 'svelte';
    import type { HTMLAttributes } from 'svelte/elements';
    import type { ActionColor, Size } from '@lib/ui/atoms';
    import type { InputVariant } from '@lib/ui/atoms/input';
    import { cn } from '@lib/ui/utils';

    export type FieldLabelProps = {
        class: string;
        'data-slot': 'field-label';
        'aria-disabled': boolean;
        required?: boolean;
    };

    export type FieldDescriptionProps = {
        class: string;
        'data-slot': 'field-description';
    };

    export const statusVariants = ['error', 'warning', 'info', 'success'] as const;
    export type FieldStatusVariant = (typeof statusVariants)[number];

    export type FieldStatusProps = {
        class: string;
        'data-slot': 'field-status';
        role: string;
        'aria-live': 'assertive' | 'polite';
    };

    export type FieldProps = HTMLAttributes<HTMLDivElement> & {
        color?: ActionColor;
        size?: Size;
        variant?: InputVariant;
        disabled?: boolean;
        label?: string | Snippet<[FieldLabelProps]>;
        labelClass?: ClassValue;
        description?: string | Snippet<[FieldDescriptionProps]>;
        descriptionClass?: ClassValue;
        status?: string | Snippet<[FieldStatusProps]>;
        statusVariant?: FieldStatusVariant;
        statusClass?: ClassValue;
        required?: boolean;
        class?: ClassValue;
    };
</script>

<script lang="ts">
    import { setInputGroupContext } from '@lib/ui/atoms/input/InputGroup.svelte';

    let {
        disabled = false,
        color,
        size,
        variant,
        label,
        labelClass,
        description,
        descriptionClass,
        status,
        statusVariant = 'error',
        statusClass,
        required,
        class: className,
        children,
        ...restProps
    }: FieldProps = $props();

    setInputGroupContext({
        get color() {
            return color ?? 'primary';
        },
        get size() {
            return size;
        },
        get variant() {
            return variant;
        },
        get disabled() {
            return disabled;
        }
    });

    const cls = $derived(cn('grid space-y-2', className));

    const labelCls = $derived(
        cn(
            'text-md font-medium leading-none',
            color && `text-on-${color}`,
            disabled && 'cursor-not-allowed opacity-70',
            labelClass
        )
    );
    const labelProps: FieldLabelProps = $derived({
        class: labelCls,
        'aria-disabled': disabled,
        'data-slot': 'field-label' as const
    });

    const descriptionCls = $derived(
        cn('text-sm', color && `text-on-${color}`, disabled && 'opacity-70', descriptionClass)
    );
    const descriptionProps: FieldDescriptionProps = $derived({
        class: descriptionCls,
        'data-slot': 'field-description' as const
    });

    // Map variants to default ActionColors (same as FieldStatus)
    const statusVariantColorMap = {
        error: 'danger',
        warning: 'warning',
        info: 'info',
        success: 'success'
    } as const;

    const statusColor = $derived(statusVariantColorMap[statusVariant]);
    const statusAriaRole = $derived(statusVariant === 'error' ? 'alert' : 'status');
    const statusAriaLive = $derived(statusVariant === 'error' ? 'assertive' : 'polite');

    const statusCls = $derived(
        cn('text-sm font-medium', `text-on-${statusColor}`, disabled && 'opacity-70', statusClass)
    );
    const statusProps: FieldStatusProps = $derived({
        class: statusCls,
        'data-slot': 'field-status' as const,
        role: statusAriaRole,
        'aria-live': statusAriaLive
    });
</script>

<div data-slot="field" class={cls} {...restProps}>
    {#if typeof label === 'string'}
        <label {...labelProps}>
            {label}
            {#if required}
                <span class="text-on-danger ml-0.5" aria-label="required">*</span>
            {/if}
        </label>
    {:else if label}
        {@render label({ ...labelProps, required })}
    {/if}

    {#if typeof description === 'string'}
        <p {...descriptionProps}>
            {description}
        </p>
    {:else if description}
        {@render description(descriptionProps)}
    {/if}

    {@render children?.()}

    {#if typeof status === 'string'}
        <p {...statusProps}>
            <span class="block">{status}</span>
        </p>
    {:else}
        {@render status?.(statusProps)}
    {/if}
</div>
