<script module lang="ts">
    import type { Snippet } from 'svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import { getButtonStyle } from '@lib/ui/atoms/input/Button.svelte';
    import Dialog, { type DialogProps } from '@lib/ui/atoms/layouts/Dialog.svelte';

    export type ConfirmationDialogProps = Pick<
        DialogProps,
        'width' | 'color' | 'role' | 'shadow' | 'to' | 'trigger' | 'triggerClass' | 'open' | 'onOpenChange'
    > & {
        title: string;
        question: string;
        confirm: string | Snippet<[{ class: string }]>;
        onConfirm?: () => void;
        cancel?: string | Snippet<[{ class: string }]>;
        onCancel?: () => void;
        mandatory?: boolean;
    };
</script>

<script lang="ts">
    let {
        open,
        title,
        question,
        confirm,
        onConfirm = undefined,
        cancel = undefined,
        onCancel = undefined,
        mandatory = false,
        ...restProps
    }: ConfirmationDialogProps = $props();

    const cancelClass = $derived(getButtonStyle({}, 'auto'));
    const handleCancel = () => {
        open = false;
        onCancel?.();
    };

    const confirmClass = $derived(getButtonStyle({ color: 'primary' }, 'auto'));
    const handleConfirm = () => {
        open = false;
        onConfirm?.();
    };
</script>

<Dialog
    {title}
    bind:open
    escapeKeydownBehavior={mandatory ? 'ignore' : undefined}
    interactOutsideBehavior={mandatory ? 'ignore' : undefined}
    {...restProps}
>
    <Typography variant="text">
        {question}
    </Typography>

    {#snippet actions()}
        {#if typeof cancel === 'string'}
            <button onclick={handleCancel} class={cancelClass}>{cancel}</button>
        {:else}
            {@render cancel?.({ class: cancelClass })}
        {/if}

        {#if typeof confirm === 'string'}
            <button onclick={handleConfirm} class={confirmClass}>{confirm}</button>
        {:else}
            {@render confirm?.({ class: confirmClass })}
        {/if}
    {/snippet}
</Dialog>
