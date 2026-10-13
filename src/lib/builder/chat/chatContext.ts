import { onDestroy } from 'svelte';
import { createContext } from '@lib/ui/utils';
import { getBuilderHubContext } from '../hubContext';
import { ChatStream, type ChatStreamOptions } from './chatStream.svelte';

const context = createContext<ChatStream>('ChatStreamContext');

/**
 * Creates the chat stream for the region and publishes it to descendants via context.
 * Call once from a layout `<script>` in an authenticated region, after {@link provideBuilderHubContext}.
 *
 * The stream subscribes to the shared hub immediately, so unread state accrues even while no
 * chat UI is mounted. It is disposed automatically when the providing component is destroyed;
 * the hub (and its socket) are unaffected.
 */
export function provideChatStreamContext(options?: ChatStreamOptions): ChatStream {
    const stream = new ChatStream(getBuilderHubContext(), options);
    context.set(stream);
    onDestroy(() => stream.dispose());
    return stream;
}

/** Reads the shared chat stream. Throws if no ancestor called {@link provideChatStreamContext}. */
export function getChatStreamContext(): ChatStream {
    const stream = context.tryGet();
    if (!stream) {
        throw new Error('ChatStreamContext was not provided: call provideChatStreamContext in the region layout.');
    }
    return stream;
}
