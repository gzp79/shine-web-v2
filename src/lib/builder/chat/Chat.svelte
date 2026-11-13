<script module lang="ts">
    import type { ClassValue } from 'svelte/elements';
    import { getLocaleContext } from '#lib/i18n';
    import Stack from '#lib/ui/atoms/layouts/Stack.svelte';
    import { ChatBubble, ChatInput, ChatMessageList } from '#lib/ui/components/chat';
    import ChatMessage from './ChatMessage.svelte';
    import ChatPing from './ChatPing.svelte';
    import ChatPong from './ChatPong.svelte';
    import type { ChatItem, ChatStream } from './chatStream.svelte';

    export type ChatProps = {
        /** The shared chat room to show and send through. */
        chat: ChatStream;
        class?: ClassValue;
    };
</script>

<script lang="ts">
    let { chat, class: className }: ChatProps = $props();

    const locale = getLocaleContext();
</script>

<Stack direction="column" spacing={2} class={className} data-slot="chat">
    <div class="min-h-0 flex-1">
        <ChatMessageList messages={chat.messages} {item} />
    </div>

    {#if chat.state !== 'live'}
        <ChatBubble content={locale.t(`chat.${chat.state}`)} align="center" />
    {/if}

    <div class="shrink-0">
        <ChatInput
            onSubmit={(text) => chat.send(text)}
            disabled={!chat.canSend}
            placeholder={locale.t('chat.placeholder')}
            sendLabel={locale.t('chat.send')}
        />
    </div>
</Stack>

{#snippet item(message: ChatItem)}
    {@const own = message.from === chat.selfId}
    {#if message.display.kind === 'ping'}
        <ChatPing from={message.from} selfMs={message.display.selfMs} {own} />
    {:else if message.display.kind === 'pong'}
        <ChatPong from={message.from} roundTripMs={message.display.roundTripMs} {own} />
    {:else}
        <ChatMessage {message} {own} />
    {/if}
{/snippet}
