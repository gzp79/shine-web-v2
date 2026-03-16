<script module lang="ts">
    import type { Snippet } from 'svelte';
    import type { ButtonAction } from '@lib/ui/atoms/input/Button.svelte';
    import { type ButtonStyleConfig } from '@lib/ui/atoms/input/style.svelte';
    import ConfirmationDialog, {
        type ConfirmationDialogProps
    } from '@lib/ui/components/dialogs/ConfirmationDialog.svelte';
    import { fromSnippet } from '@lib/ui/utils';

    export type ConfirmationButtonProps = ButtonStyleConfig & {
        to?: ConfirmationDialogProps['to'];
        confirmation: Omit<ConfirmationDialogProps, 'to' | 'confirmAction' | 'cancelAction'>;
        confirmAction?: ButtonAction;
        cancelAction?: ButtonAction;
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
        confirmAction,
        cancelAction,
        children,
        class: className
    }: ConfirmationButtonProps = $props();
</script>

<ConfirmationDialog
    {...confirmation}
    {to}
    {confirmAction}
    {cancelAction}
    trigger={fromSnippet(children)}
    triggerStyle={{ color, variant, size, wide, disabled, class: className, useGroupFocus: true }}
/>
