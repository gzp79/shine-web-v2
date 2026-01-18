<script module lang="ts">
    import { type Snippet } from 'svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import { type ButtonStyleConfig, createButtonStyle } from '@lib/ui/atoms/input/button-style.svelte';
    import Dialog, { type DialogProps } from '@lib/ui/atoms/layouts/Dialog.svelte';
    import { type RefBinding } from '@lib/ui/utils';

    export type ConfirmationDialogProps = Pick<
        DialogProps,
        'width' | 'color' | 'role' | 'shadow' | 'to' | 'trigger' | 'triggerStyle' | 'open' | 'onOpenChange'
    > & {
        title: string;
        question: string;
        confirm: string | Snippet<[{ class: string; onclick: () => void; ref: RefBinding }]>;
        confirmStyle?: ButtonStyleConfig;
        onConfirm?: () => void;
        cancel?: string | Snippet<[{ class: string; onclick: () => void }]>;
        cancelStyle?: ButtonStyleConfig;
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
        confirmStyle,
        onConfirm = undefined,
        cancel = undefined,
        cancelStyle,
        onCancel = undefined,
        preventClose = false,
        ...restProps
    }: ConfirmationDialogProps = $props();

    let confirmElement = $state<HTMLElement | null>(null);

    const cancelStl = createButtonStyle(() => ({ color: 'primary', showFocus: true, ...cancelStyle }));
    const confirmStl = createButtonStyle(() => ({ color: 'secondary', showFocus: true, ...confirmStyle }));

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
            <button onclick={handleCancel} class={cancelStl.class}>{cancel}</button>
        {:else}
            {@render cancel?.({ class: cancelStl.class, onclick: handleCancel })}
        {/if}

        {#if typeof confirm === 'string'}
            <button bind:this={confirmElement} onclick={handleConfirm} class={confirmStl.class}>{confirm}</button>
        {:else}
            {@render confirm({
                class: confirmStl.class,
                onclick: handleConfirm,
                ref: { get: () => confirmElement, set: (v) => (confirmElement = v) }
            })}
        {/if}
    {/snippet}
</Dialog>
