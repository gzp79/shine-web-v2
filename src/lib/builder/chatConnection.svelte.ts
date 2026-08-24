import { browser } from '$app/environment';
import { config } from '@config';
import { SvelteSet } from 'svelte/reactivity';
import { type ChatComment, encodeChatRequest, parseServerMessage } from './protocol';
import { ResilientWebSocket, type SocketStatus } from './websocket.svelte';

/** A chat message as surfaced to the UI. */
export type ChatMessage = {
    /** Stream id (`<ms>-<seq>`), stable and unique per message. */
    id: string;
    /** Author's user id. */
    from: string;
    text: string;
};

export type BuilderChatConnectionOptions = {
    /** Override the websocket endpoint. Defaults to the configured builder WS url. */
    url?: string;
    /** Cap the number of retained messages in memory (default: 500). */
    maxMessages?: number;
};

/** Builds the `wss://.../builder/api/connect` endpoint from the configured builder WS base url. */
export function builderChatUrl(): string {
    const base = config.builderWSUrl.replace(/^http/, 'ws').replace(/\/$/, '');
    return `${base}/api/connect`;
}

/** Orders two stream ids (`<ms>-<seq>`) chronologically. */
function compareStreamIds(a: string, b: string): number {
    const [aMs = 0, aSeq = 0] = a.split('-').map(Number);
    const [bMs = 0, bSeq = 0] = b.split('-').map(Number);
    return aMs !== bMs ? aMs - bMs : aSeq - bSeq;
}

/**
 * Reactive chat connection on top of {@link ResilientWebSocket}.
 *
 * Owns the wire protocol: encodes outgoing text as chat requests and folds incoming
 * batches into a reactive, de-duplicated, chronologically ordered message list. Delivery
 * is at-least-once, so dedup by stream id is required.
 *
 * Transport concerns (reconnect, buffering, recovery) are delegated to the socket, so this
 * class stays focused on chat semantics and is trivial to unit test with a mocked socket.
 */
export class BuilderChatConnection {
    readonly #socket: ResilientWebSocket;
    readonly #maxMessages: number;
    readonly #seen = new SvelteSet<string>();

    #messages = $state<ChatMessage[]>([]);

    constructor(options: BuilderChatConnectionOptions = {}) {
        this.#maxMessages = options.maxMessages ?? 500;
        this.#socket = new ResilientWebSocket({
            url: options.url ?? builderChatUrl(),
            onMessage: (data) => this.#handleMessage(data)
        });
    }

    /** Reactive connection status. */
    get status(): SocketStatus {
        return this.#socket.status;
    }

    /** True while messages can be sent immediately. Reactive. */
    get isConnected(): boolean {
        return this.#socket.isConnected;
    }

    /** Reactive, ordered, de-duplicated message list. */
    get messages(): readonly ChatMessage[] {
        return this.#messages;
    }

    /** Opens the connection. No-op on the server. */
    connect(): void {
        this.#socket.connect();
    }

    /** Sends a plain-text chat message. Buffered by the socket if currently disconnected. */
    send(text: string): void {
        const trimmed = text.trim();
        if (!trimmed) return;
        this.#socket.send(encodeChatRequest(trimmed));
    }

    /** Closes the connection and disables reconnection. */
    close(): void {
        this.#socket.close();
    }

    /** Permanently disposes the connection. */
    destroy(): void {
        this.#socket.destroy();
    }

    #handleMessage(raw: string): void {
        if (!browser) return;
        const message = parseServerMessage(raw);
        if (!message) return;

        const fresh = message.messages.filter((comment) => !this.#seen.has(comment.id));
        if (fresh.length === 0) return;

        for (const comment of fresh) {
            this.#seen.add(comment.id);
        }

        const merged = [...this.#messages, ...fresh.map(toChatMessage)];
        merged.sort((a, b) => compareStreamIds(a.id, b.id));

        // Trim the oldest messages past the retention cap, keeping `#seen` in sync.
        if (merged.length > this.#maxMessages) {
            const dropped = merged.splice(0, merged.length - this.#maxMessages);
            for (const message of dropped) {
                this.#seen.delete(message.id);
            }
        }

        this.#messages = merged;
    }
}

function toChatMessage(comment: ChatComment): ChatMessage {
    return { id: comment.id, from: comment.from, text: comment.text };
}
