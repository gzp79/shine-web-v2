<script module lang="ts">
    import type { ClassValue } from 'clsx';
    import type { Snippet } from 'svelte';
    import { getLocaleContext } from '@lib/i18n';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import { cn } from '@lib/ui/utils';

    export type ChatMessageLike = { id: string };

    export type ChatMessageListProps<T extends ChatMessageLike = ChatMessageLike> = {
        /** The conversation to render in order. */
        messages: readonly T[];
        /** Renders a single message; the caller decides how each kind looks. */
        item: Snippet<[T]>;
        /** Follow new messages by scrolling to the bottom when the user is already near it (default: true). */
        autoScroll?: boolean;
        class?: ClassValue;
    };
</script>

<script lang="ts" generics="T extends ChatMessageLike">
    let { messages, item, autoScroll = true, class: className }: ChatMessageListProps<T> = $props();

    const locale = getLocaleContext();

    const NEAR_BOTTOM_PX = 64;
    const NEAR_TOP_PX = 8;

    let viewport = $state<HTMLDivElement | null>(null);
    // Follow the newest message only while the user is parked near the bottom, so we never yank
    // them away while they read back through history.
    let stickToBottom = $state(true);
    // Last observed scrollTop, used to tell a user's upward scroll from a downward pin/append.
    let lastScrollTop = 0;

    // How to preserve the view across the *next* list mutation, captured from the pre-mutation DOM
    // in $effect.pre and applied against the post-mutation DOM in $effect:
    //   bottom - the user is at the end: keep them pinned there (follow new messages).
    //   top    - the user is at the start: keep them there.
    //   middle - hold the visible items still by restoring an anchor element's offset, so dropping
    //            older messages off the top (retention cap) doesn't make the view jump.
    type Anchor = { id: string; offset: number };
    let pendingMode: 'bottom' | 'top' | 'middle' = 'bottom';
    let pendingAnchor: Anchor | null = null;

    function onScroll(): void {
        if (!viewport) return;
        const { scrollTop, scrollHeight, clientHeight } = viewport;
        const distance = scrollHeight - scrollTop - clientHeight;
        // Near the bottom: follow. Otherwise only disengage when the user actively scrolls *up* — a
        // programmatic pin or an append only ever raises scrollTop, so neither stops the follow.
        if (distance <= NEAR_BOTTOM_PX) {
            stickToBottom = true;
        } else if (scrollTop < lastScrollTop) {
            stickToBottom = false;
        }
        lastScrollTop = scrollTop;
    }

    // The first message element at least partially in view, with its offset from the viewport top.
    // Restoring it to the same offset after a mutation keeps the visible items still.
    function captureAnchor(): Anchor | null {
        if (!viewport) return null;
        const viewportTop = viewport.getBoundingClientRect().top;
        for (const child of viewport.children) {
            const id = (child as HTMLElement).dataset.msgId;
            if (id === undefined) continue;
            const rect = child.getBoundingClientRect();
            if (rect.bottom > viewportTop) return { id, offset: rect.top - viewportTop };
        }
        return null;
    }

    // Runs before the DOM reflects appended/dropped messages: snapshot where the user is now.
    $effect.pre(() => {
        void messages.length;
        if (!autoScroll || !viewport) return;
        if (stickToBottom) {
            pendingMode = 'bottom';
        } else if (viewport.scrollTop <= NEAR_TOP_PX) {
            pendingMode = 'top';
        } else {
            pendingMode = 'middle';
            pendingAnchor = captureAnchor();
        }
    });

    // Runs after the DOM updates: restore the view according to the snapshot above.
    $effect(() => {
        void messages.length;
        if (!autoScroll || !viewport) return;
        if (pendingMode === 'bottom') {
            viewport.scrollTop = viewport.scrollHeight;
        } else if (pendingMode === 'top') {
            viewport.scrollTop = 0;
        } else if (pendingAnchor) {
            const el = viewport.querySelector<HTMLElement>(`[data-msg-id="${CSS.escape(pendingAnchor.id)}"]`);
            // If the anchor itself was dropped off the top, leave the position untouched.
            if (el) {
                const currentOffset = el.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
                viewport.scrollTop += currentOffset - pendingAnchor.offset;
            }
        }
        // Record our own write so the scroll event it emits isn't mistaken for a user scroll.
        lastScrollTop = viewport.scrollTop;
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
            <Typography variant="footnote" class="opacity-60">{locale.t('chat.noMessages')}</Typography>
        </Stack>
    {:else}
        {#each messages as message (message.id)}
            <div data-msg-id={message.id}>
                {@render item(message)}
            </div>
        {/each}
    {/if}
</div>
