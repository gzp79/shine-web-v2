<script module lang="ts">
    import type { ClassValue } from 'svelte/elements';
    import type { ChatStream } from '@lib/builder';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import { ChatGap, ChatInput, ChatMessageList } from '@lib/ui/components/chat';
    import ChatMessage from './ChatMessage.svelte';
    import ChatPing from './ChatPing.svelte';
    import ChatPong from './ChatPong.svelte';
    import type { ChatMessage as ChatMessageData } from './chatMessages';

    export type ChatProps = {
        /** The shared chat stream to render and send through. */
        chat: ChatStream;
        class?: ClassValue;
    };
</script>

<script lang="ts">
    let { chat, class: className }: ChatProps = $props();

    function own(message: ChatMessageData): boolean {
        return 'from' in message && message.from === chat.selfId;
    }
</script>

<Stack direction="column" spacing={2} class={className} data-slot="chat">
    <div class="min-h-0 flex-1">
        <ChatMessageList messages={chat.messages} {item} />
    </div>

    <div class="shrink-0">
        <ChatInput onSubmit={(text) => chat.send(text)} />
    </div>
</Stack>

{#snippet item(message: ChatMessageData)}
    {#if message.kind === 'gap'}
        <ChatGap />
    {:else if message.kind === 'ping'}
        <ChatPing {message} own={own(message)} />
    {:else if message.kind === 'pong'}
        <ChatPong {message} own={own(message)} />
    {:else if message.kind === 'text'}
        <ChatMessage {message} own={own(message)} />
    {/if}
{/snippet}
