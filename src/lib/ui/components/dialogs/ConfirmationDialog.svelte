<script module lang="ts">
    import { type Snippet } from 'svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Button, { type ButtonAction, type ButtonProps } from '@lib/ui/atoms/input/Button.svelte';
    import { type ButtonStyleConfig, createButtonStyle } from '@lib/ui/atoms/input/style.svelte';
    import Dialog, { type DialogProps } from '@lib/ui/atoms/layouts/Dialog.svelte';
    import { type RefBinding } from '@lib/ui/utils';

    export type ConfirmationDialogProps = Pick<
        DialogProps,
        'width' | 'color' | 'role' | 'shadow' | 'to' | 'trigger' | 'triggerStyle' | 'open' | 'onOpenChange'
    > & {
        title: string;
        question: string;
        confirm: string | Snippet<[{ class: string; action: ButtonAction; ref: RefBinding }]>;
        confirmAction?: ButtonAction;
        confirmStyle?: ButtonStyleConfig;
        cancel?: string | Snippet<[{ class: string; action: ButtonAction }]>;
        cancelAction?: ButtonAction;
        cancelStyle?: ButtonStyleConfig;
        preventClose?: boolean;
    };
</script>

<script lang="ts">
    let {
        open = $bindable(false),
        title,
        question,
        confirm,
        confirmAction = undefined,
        confirmStyle,
        cancel = undefined,
        cancelAction = undefined,
        cancelStyle,
        preventClose = false,
        ...restProps
    }: ConfirmationDialogProps = $props();

    let confirmElement = $state<HTMLElement | null>(null);

    const cancelStl = createButtonStyle(() => ({ color: 'primary', showFocus: true, ...cancelStyle }));
    const confirmStl = createButtonStyle(() => ({ color: 'secondary', showFocus: true, ...confirmStyle }));

    const wrapAction = (action: ButtonAction | undefined): ButtonAction => {
        if (action && 'href' in action && action.href) {
            return action;
        }

        const onclick = action && 'onclick' in action ? action.onclick : undefined;
        return {
            onclick: (e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => {
                open = false;
                if (typeof onclick === 'function') onclick.call(undefined, e);
            }
        };
    };

    const cancelBtnAction = $derived(wrapAction(cancelAction));
    const confirmBtnAction = $derived(wrapAction(confirmAction));

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
            <Button color="primary" {...cancelStyle} {...cancelBtnAction as ButtonProps}>{cancel}</Button>
        {:else}
            {@render cancel?.({ class: cancelStl.class, action: cancelBtnAction })}
        {/if}

        {#if typeof confirm === 'string'}
            <Button bind:ref={confirmElement} color="secondary" {...confirmStyle} {...confirmBtnAction as ButtonProps}
                >{confirm}</Button
            >
        {:else}
            {@render confirm({
                class: confirmStl.class,
                action: confirmBtnAction,
                ref: { get: () => confirmElement, set: (v) => (confirmElement = v) }
            })}
        {/if}
    {/snippet}
</Dialog>
