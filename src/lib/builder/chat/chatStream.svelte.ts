import { SvelteSet } from 'svelte/reactivity';
import type { BuilderHub, ServerFrame } from '../hub';
import { CHAT_FRAME_TYPE, type ChatComment, encodeChatRequest, parseChatComments } from './chatProtocol';

/** A chat message as surfaced to the UI. */
export type ChatMessage = {
    /** Stream id (`<ms>-<seq>`), stable and unique per message. */
    id: string;
    /** Author's user id. */
    from: string;
    text: string;
};

export type ChatStreamOptions = {
    /** Cap the number of retained messages in memory (default: 500). */
    maxMessages?: number;
};

/** Orders two stream ids (`<ms>-<seq>`) chronologically. */
function compareStreamIds(a: string, b: string): number {
    const [aMs = 0, aSeq = 0] = a.split('-').map(Number);
    const [bMs = 0, bSeq = 0] = b.split('-').map(Number);
    return aMs !== bMs ? aMs - bMs : aSeq - bSeq;
}

/**
 * The chat channel: one consumer of the shared {@link BuilderHub}.
 *
 * Subscribes to `chat` frames on construction and folds incoming batches into a reactive,
 * de-duplicated, chronologically ordered message list. Delivery is at-least-once, so dedup by
 * stream id is required. Outgoing text is encoded and handed to the hub.
 *
 * It owns no transport: the socket's lifetime and resilience belong to the hub, so the stream
 * keeps accruing messages (and unread state) for as long as it is subscribed, regardless of
 * whether any chat UI is currently mounted.
 */
export class ChatStream {
    readonly #hub: BuilderHub;
    readonly #maxMessages: number;
    readonly #seen = new SvelteSet<string>();
    readonly #unsubscribe: () => void;

    #messages = $state<ChatMessage[]>([]);
    /** Stream id of the last message the caller has marked as read; `undefined` means none read yet. */
    #lastReadId = $state<string | undefined>(undefined);

    constructor(hub: BuilderHub, options: ChatStreamOptions = {}) {
        this.#hub = hub;
        this.#maxMessages = options.maxMessages ?? 500;
        this.#unsubscribe = hub.on(CHAT_FRAME_TYPE, (frame) => this.#handleFrame(frame));
    }

    /** Reactive, ordered, de-duplicated message list. */
    get messages(): readonly ChatMessage[] {
        return this.#messages;
    }

    /** Number of messages newer than the last {@link markAllRead} call. Reactive. */
    get unreadCount(): number {
        const lastReadId = this.#lastReadId;
        if (!lastReadId) return this.#messages.length;
        let count = 0;
        for (let i = this.#messages.length - 1; i >= 0; i--) {
            const message = this.#messages[i];
            if (!message || compareStreamIds(message.id, lastReadId) <= 0) break;
            count++;
        }
        return count;
    }

    /** True while {@link unreadCount} is non-zero. Reactive. */
    get hasUnread(): boolean {
        return this.unreadCount > 0;
    }

    /** Marks all currently known messages as read, clearing {@link unreadCount}. */
    markAllRead(): void {
        this.#lastReadId = this.#messages.at(-1)?.id;
    }

    /** Sends a plain-text chat message. Buffered by the hub's socket if currently disconnected. */
    send(text: string): void {
        const trimmed = text.trim();
        if (!trimmed) return;
        this.#hub.send(encodeChatRequest(trimmed));
    }

    /** Unsubscribes from the hub. The hub (and its socket) live on. */
    dispose(): void {
        this.#unsubscribe();
    }

    #handleFrame(frame: ServerFrame): void {
        const comments = parseChatComments(frame);
        const fresh = comments.filter((comment) => !this.#seen.has(comment.id));
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
