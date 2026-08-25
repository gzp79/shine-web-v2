<script module lang="ts">
    import type { ClassValue } from 'clsx';
    import type { Snippet } from 'svelte';
    import { cn } from '@lib/ui/utils';
    import ChatBubble from './ChatBubble.svelte';

    /** A message item as consumed by the list. Deliberately decoupled from any transport type. */
    export type ChatListItem = {
        id: string;
        text: string;
        /** Whether this message belongs to the current user (aligned to the end). */
        own: boolean;
        /** Pre-rendered author label; ignored when the caller supplies a custom `item` snippet. */
        author?: string;
        /** Author's user id, for callers that resolve the label themselves. */
        authorId?: string;
    };

    /**
     * True when `current` is not the immediate successor of `prev` by the sequence part
     * of a stream id (`<ms>-<seq>`) — i.e. one or more ids are missing between them.
     * Always false when there is no predecessor.
     */
    function hasGap(prev: ChatListItem | undefined, current: ChatListItem): boolean {
        if (!prev) return false;
        const prevSeq = Number(prev.id.split('-')[1]);
        const currentSeq = Number(current.id.split('-')[1]);
        return currentSeq - prevSeq > 1;
    }

    export type ChatMessageListProps = {
        messages: readonly ChatListItem[];
        /** Follow new messages by scrolling to the bottom when the user is already near it (default: true). */
        autoScroll?: boolean;
        /** Rendered when there are no messages. */
        empty?: Snippet;
        /** Custom renderer for a single item; defaults to {@link ChatBubble}. */
        item?: Snippet<[ChatListItem]>;
        class?: ClassValue;
    };
</script>

<script lang="ts">
    let { messages, autoScroll = true, empty, item, class: className }: ChatMessageListProps = $props();

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
        {@render empty?.()}
    {:else}
        {#each messages as message, i (message.id)}
            {#if hasGap(messages[i - 1], message)}
                <div data-slot="chat-skip" class="text-secondary flex justify-center py-1 text-sm select-none">
                    [...]
                </div>
            {/if}
            {#if item}
                {@render item(message)}
            {:else}
                <ChatBubble text={message.text} own={message.own} author={message.author} />
            {/if}
        {/each}
    {/if}
</div>
