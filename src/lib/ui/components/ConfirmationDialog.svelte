<script module lang="ts">
    import { type Snippet } from 'svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import { getButtonStyle } from '@lib/ui/atoms/input/Button.svelte';
    import Dialog, { type DialogProps } from '@lib/ui/atoms/layouts/Dialog.svelte';
    import { type RefBinding } from '@lib/ui/utils';

    export type ConfirmationDialogProps = Pick<
        DialogProps,
        'width' | 'color' | 'role' | 'shadow' | 'to' | 'trigger' | 'triggerX' | 'triggerClass' | 'open' | 'onOpenChange'
    > & {
        title: string;
        question: string;
        confirm: string | Snippet<[{ class: string; onclick: () => void; ref: RefBinding }]>;
        onConfirm?: () => void;
        cancel?: string | Snippet<[{ class: string; onclick: () => void }]>;
        onCancel?: () => void;
        preventClose?: boolean;
    };
</script>

<script lang="ts">
    let {
        open = $bindable(false),
        title,
        question,
        confirm,
        onConfirm = undefined,
        cancel = undefined,
        onCancel = undefined,
        preventClose = false,
        ...restProps
    }: ConfirmationDialogProps = $props();

    let confirmElement = $state<HTMLElement | null>(null);

    const cancelCls = $derived(getButtonStyle({ color: 'primary', showFocus: true }, 'auto'));
    const confirmCls = $derived(getButtonStyle({ color: 'secondary', showFocus: true }, 'auto'));

    const handleCancel = () => {
        open = false;
        onCancel?.();
    };
    const handleConfirm = () => {
        open = false;
        onConfirm?.();
    };
    const onOpenAutoFocus = (e: Event) => {
        e.preventDefault();
        confirmElement?.focus();
    };
</script>

<Dialog
    {title}
    bind:open
    escapeKeydownBehavior={preventClose ? 'ignore' : undefined}
    interactOutsideBehavior={preventClose ? 'ignore' : undefined}
    closeIcon={!preventClose}
    {onOpenAutoFocus}
    {...restProps}
>
    <Typography variant="text">
        {question}
    </Typography>

    {#snippet actions()}
        {#if typeof cancel === 'string'}
            <button onclick={handleCancel} class={cancelCls}>{cancel}</button>
        {:else}
            {@render cancel?.({ class: cancelCls, onclick: handleCancel })}
        {/if}

        {#if typeof confirm === 'string'}
            <button bind:this={confirmElement} onclick={handleConfirm} class={confirmCls}>{confirm}</button>
        {:else}
            {@render confirm({
                class: confirmCls,
                onclick: handleConfirm,
                ref: { get: () => confirmElement, set: (v) => (confirmElement = v) }
            })}
        {/if}
    {/snippet}
</Dialog>
