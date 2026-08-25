<script module lang="ts">
    import type { ClassValue } from 'clsx';
    import type { ActionColor, Size } from '@lib/ui/atoms';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Input from '@lib/ui/atoms/input/Input.svelte';
    import InputGroup from '@lib/ui/atoms/input/InputGroup.svelte';
    import { cn } from '@lib/ui/utils';
    import { ENTER } from '@lib/ui/utils/kbd';

    export type ChatInputProps = {
        /** Called with the trimmed message text on submit. Empty submissions are ignored. */
        onSubmit: (text: string) => void;
        placeholder?: string;
        /** Text on the send button. */
        sendLabel?: string;
        disabled?: boolean;
        color?: ActionColor;
        size?: Size;
        /** Bindable current input value. */
        value?: string;
        class?: ClassValue;
    };
</script>

<script lang="ts">
    let {
        onSubmit,
        placeholder = 'Type a message…',
        sendLabel = 'Send',
        disabled = false,
        color = 'primary',
        size = 'md',
        value = $bindable(''),
        class: className
    }: ChatInputProps = $props();

    const canSend = $derived(!disabled && value.trim().length > 0);

    function submit(): void {
        if (!canSend) return;
        onSubmit(value.trim());
        value = '';
    }

    function onKeydown(event: KeyboardEvent): void {
        // Enter submits; Shift+Enter is left free for a future multi-line variant.
        if (event.key === ENTER && !event.shiftKey) {
            event.preventDefault();
            submit();
        }
    }
</script>

<InputGroup {color} {size} {disabled} class={cn('w-full', className)} data-slot="chat-input">
    <Input
        bind:value
        {placeholder}
        {disabled}
        wide
        type="text"
        autocomplete="off"
        aria-label={placeholder}
        onkeydown={onKeydown}
    />
    <Button type="button" disabled={!canSend} onclick={submit}>{sendLabel}</Button>
</InputGroup>
