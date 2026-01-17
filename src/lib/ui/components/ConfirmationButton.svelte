<script module lang="ts">
    import type { Snippet } from 'svelte';
    import { type ButtonStyleProps, getButtonStyle } from '@lib/ui/atoms/input/Button.svelte';
    import { type DialogTriggerXProps } from '@lib/ui/atoms/layouts/Dialog.svelte';
    import ConfirmationDialog, { type ConfirmationDialogProps } from '@lib/ui/components/ConfirmationDialog.svelte';

    export type ConfirmationButtonProps = ButtonStyleProps & {
        to?: ConfirmationDialogProps['to'];
        confirmation: Omit<ConfirmationDialogProps, 'to' | 'onConfirm' | 'onCancel'>;
        onConfirm?: ConfirmationDialogProps['onConfirm'];
        onCancel?: ConfirmationDialogProps['onCancel'];
        children?: Snippet;
    };
</script>

<script lang="ts">
    let {
        to,
        color,
        variant,
        size,
        wide,
        disabled,
        confirmation,
        onConfirm,
        onCancel,
        children,
        class: className
    }: ConfirmationButtonProps = $props();

    let btnCls = $derived(
        getButtonStyle(
            {
                color,
                wide,
                size,
                variant,
                disabled,
                class: className,
                useGroupFocus: true
            },
            'auto'
        )
    );

    let triggerX = $derived({ disabled } satisfies DialogTriggerXProps);
</script>

<ConfirmationDialog {...confirmation} {to} {triggerX} {onConfirm} {onCancel}>
    {#snippet trigger()}
        <div class={btnCls}>
            {@render children?.()}
        </div>
    {/snippet}
</ConfirmationDialog>
