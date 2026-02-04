<script module lang="ts">
    import type { Snippet } from 'svelte';
    import { type ButtonStyleConfig } from '@lib/ui/atoms/input/style.svelte';
    import ConfirmationDialog, { type ConfirmationDialogProps } from '@lib/ui/components/ConfirmationDialog.svelte';
    import { fromSnippet } from '@lib/ui/utils';

    export type ConfirmationButtonProps = ButtonStyleConfig & {
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
</script>

<ConfirmationDialog
    {...confirmation}
    {to}
    {onConfirm}
    {onCancel}
    trigger={fromSnippet(children)}
    triggerStyle={{ color, variant, size, wide, disabled, class: className, useGroupFocus: true }}
/>
