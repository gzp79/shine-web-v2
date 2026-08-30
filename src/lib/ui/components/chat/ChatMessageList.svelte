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

    let viewport = $state<HTMLDivElement | null>(null);
    // Follow the newest message only while the user is parked near the bottom, so we never yank
    // them away while they read back through history.
    let stickToBottom = $state(true);

    // When not following the bottom, hold the bottommost visible message steady across the *next* list
    // mutation: captured from the pre-mutation DOM in $effect.pre and restored against the
    // post-mutation DOM in $effect, so prepending older messages or dropping them off the top
    // (retention cap) doesn't make the view jump.
    type Anchor = { id: string; offset: number };
    let pendingAnchor: Anchor | null = null;

    function onScroll(): void {
        if (!viewport) return;
        const { scrollTop, scrollHeight, clientHeight } = viewport;
        // Distance-based and self-correcting: a programmatic pin lands at ~0 (stays stuck), while a
        // scroll up grows the distance past the threshold (unsticks). No need to track direction.
        stickToBottom = scrollHeight - scrollTop - clientHeight <= NEAR_BOTTOM_PX;
    }

    // The last message element at least partially in view, with its offset from the viewport top.
    // Restoring it to the same offset after a mutation keeps the visible items still. Anchoring the
    // bottommost visible message (rather than the topmost) is more robust for the retention cap:
    // messages only ever drop off the *top*, so a bottom anchor is almost never the one removed.
    function captureAnchor(): Anchor | null {
        if (!viewport) return null;
        const viewportRect = viewport.getBoundingClientRect();
        const children = viewport.children;
        for (let i = children.length - 1; i >= 0; i--) {
            const child = children[i] as HTMLElement;
            const id = child.dataset.msgId;
            if (id === undefined) continue;
            const rect = child.getBoundingClientRect();
            if (rect.top < viewportRect.bottom) return { id, offset: rect.top - viewportRect.top };
        }
        return null;
    }

    // Runs before the DOM reflects appended/dropped messages: when not following the bottom,
    // snapshot the bottommost visible message so we can hold it steady.
    $effect.pre(() => {
        void messages.length;
        if (!autoScroll || !viewport) return;
        pendingAnchor = stickToBottom ? null : captureAnchor();
    });

    // Runs after the DOM updates: follow the bottom, or restore the anchored message's offset.
    $effect(() => {
        void messages.length;
        if (!autoScroll || !viewport) return;
        if (stickToBottom) {
            viewport.scrollTop = viewport.scrollHeight;
        } else if (pendingAnchor) {
            const el = viewport.querySelector<HTMLElement>(`[data-msg-id="${CSS.escape(pendingAnchor.id)}"]`);
            // If the anchor itself was dropped off the top, leave the position untouched.
            if (el) {
                const currentOffset = el.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
                viewport.scrollTop += currentOffset - pendingAnchor.offset;
            }
        }
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
