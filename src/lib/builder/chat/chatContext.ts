import { onDestroy } from 'svelte';
import { createContext } from '@lib/ui/utils';
import { BuilderChatConnection, type BuilderChatConnectionOptions } from './chatConnection.svelte';

const context = createContext<BuilderChatConnection>('builder-chat-connection');

/**
 * Creates a builder chat connection and publishes it to descendants via context.
 * Call once from a layout `<script>` in an authenticated region.
 *
 * The connection is created **idle** — no socket is opened here. It is established
 * lazily on the first {@link useChatConnection} call, so regions that never touch
 * chat pay nothing. The connection is disposed automatically when the providing
 * component is destroyed (i.e. when navigating out of the region).
 */
export function provideChatConnection(options?: BuilderChatConnectionOptions): BuilderChatConnection {
    const connection = new BuilderChatConnection(options);
    context.set(connection);
    onDestroy(() => connection.destroy());
    return connection;
}

/**
 * Reads the shared chat connection and opens its socket on first use (idempotent,
 * SSR-safe). Once opened it stays connected for the provider's lifetime, so it is
 * shared across navigations within the region.
 *
 * Throws if no ancestor called {@link provideChatConnection}.
 */
export function useChatConnection(): BuilderChatConnection {
    const connection = context.tryGet();
    if (!connection) {
        throw new Error(
            'useChatConnection: no chat connection in context (call provideChatConnection in the region layout)'
        );
    }
    connection.connect();
    return connection;
}

/** Reads the shared chat connection without opening it, or `undefined` when none is provided. */
export function tryGetChatConnection(): BuilderChatConnection | undefined {
    return context.tryGet();
}
