<script module lang="ts">
    import type { ClassValue } from 'clsx';
    import type { Snippet } from 'svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import { cn } from '@lib/ui/utils';
    import ChatGap from './ChatGap.svelte';
    import ChatMessage from './ChatMessage.svelte';
    import ChatPing from './ChatPing.svelte';
    import ChatPong from './ChatPong.svelte';
    import type { ChatMessage as ChatMessageData } from './chatMessages';

    export type ChatMessageListProps = {
        /** The conversation to render in order; `gap` entries are drawn as centered system notes. */
        messages: readonly ChatMessageData[];
        /** Current user's id; messages from this id are aligned to the end. */
        selfId: string;
        /** Resolves the author label for a user id. */
        user: Snippet<[string]>;
        /** Follow new messages by scrolling to the bottom when the user is already near it (default: true). */
        autoScroll?: boolean;
        class?: ClassValue;
    };
</script>

<script lang="ts">
    let { messages, selfId, user, autoScroll = true, class: className }: ChatMessageListProps = $props();

    let viewport = $state<HTMLDivElement | null>(null);
    // Only auto-follow when the user is already parked near the bottom, so we don't
    // yank them away while they scroll back through history.
    let stickToBottom = $state(true);

    const NEAR_BOTTOM_PX = 64;

    function onScroll(): void {
        if (!viewport) return;
        const distance = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
        stickToBottom = distance <= NEAR_BOTTOM_PX;
    }

    // Re-run whenever the message list identity changes; `messages.length` keeps the
    // dependency explicit so appends trigger a scroll.
    $effect(() => {
        void messages.length;
        if (!autoScroll || !stickToBottom || !viewport) return;
        // Wait for the DOM to paint the new node before measuring scrollHeight.
        requestAnimationFrame(() => {
            if (viewport) viewport.scrollTop = viewport.scrollHeight;
        });
    });
</script>

<div
    bind:this={viewport}
    onscroll={onScroll}
    data-slot="chat-message-list"
    class={cn('flex h-full w-full flex-col gap-2 overflow-y-auto overflow-x-hidden', className)}
>
    {#if messages.length === 0}
        <Stack alignment="center" justification="center" class="h-full">
            <Typography variant="footnote" class="opacity-60">No messages yet.</Typography>
        </Stack>
    {:else}
        {#each messages as message (message.id)}
            {#if message.kind === 'gap'}
                <ChatGap />
            {:else if message.kind === 'ping'}
                <ChatPing {message} own={message.from === selfId} {user} />
            {:else if message.kind === 'pong'}
                <ChatPong {message} own={message.from === selfId} {user} />
            {:else if message.kind === 'text'}
                <ChatMessage {message} own={message.from === selfId} {user} />
            {/if}
        {/each}
    {/if}
</div>
