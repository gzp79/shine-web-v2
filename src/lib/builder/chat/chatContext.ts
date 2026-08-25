import { onDestroy } from 'svelte';
import { createContext } from '@lib/ui/utils';
import { getBuilderHub } from '../hubContext';
import { ChatStream, type ChatStreamOptions } from './chatStream.svelte';

const context = createContext<ChatStream>('builder-chat-stream');

/**
 * Creates the chat stream for the region and publishes it to descendants via context.
 * Call once from a layout `<script>` in an authenticated region, after {@link provideBuilderHub}.
 *
 * The stream subscribes to the shared hub immediately, so unread state accrues even while no
 * chat UI is mounted. It is disposed automatically when the providing component is destroyed;
 * the hub (and its socket) are unaffected.
 */
export function provideChatStream(options?: ChatStreamOptions): ChatStream {
    const stream = new ChatStream(getBuilderHub(), options);
    context.set(stream);
    onDestroy(() => stream.dispose());
    return stream;
}

/** Reads the shared chat stream. Throws if no ancestor called {@link provideChatStream}. */
export function getChatStream(): ChatStream {
    const stream = context.tryGet();
    if (!stream) {
        throw new Error('getChatStream: no chat stream in context (call provideChatStream in the region layout)');
    }
    return stream;
}

/** Reads the shared chat stream, or `undefined` when none is provided. */
export function tryGetChatStream(): ChatStream | undefined {
    return context.tryGet();
}
