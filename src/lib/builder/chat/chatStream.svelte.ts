import type { ChatMessage, PingMessage, PongMessage, TextMessage } from '@lib/ui/components/chat';
import type { BuilderHub, ServerFrame } from '../hub';
import { CHAT_FRAME_TYPE, type ChatComment, encodeChatRequest, parseChatComments } from './chatProtocol';

type StoredMessage = TextMessage | PingMessage | PongMessage;

export type ChatStreamOptions = {
    /** Cap the number of retained messages in memory (default: 500). */
    maxMessages?: number;
};

// Client-only `@ping`/`@pong` latency probe, encoded inside plain chat text. The builder chat
// server is a dumb broadcast relay (it echoes `{type:'chat', text}` to every client, sender
// included), so there is no server support — just a convention recognised on the way back.
//
// Wire format (whitespace-separated, timestamps are epoch milliseconds):
//   @ping <id> <t0>          id = initiator's user id, t0 = initiator's clock at send
//   @pong <id> <t0> <tR>     id/t0 echoed from the ping, tR = responder's clock at send
//
// Every timing uses a single clock (the sender's own echo), so all are free of cross-user skew:
//   - initiator, on its own ping echo:  now - t0   -> its server round-trip
//   - initiator, on a peer's pong:      now - t0   -> full user<->user round-trip to that peer
//   - responder, on its own pong echo:  now - tR   -> its own server round-trip
const PING_TOKEN = '@ping';
const PONG_TOKEN = '@pong';

type ParsedCommand =
    { kind: 'ping'; id: string; t0: number } | { kind: 'pong'; id: string; t0: number; tR: number } | { kind: 'none' };

function parseTimestamp(value: string | undefined): number | undefined {
    if (value === undefined || !/^\d+$/.test(value)) return undefined;
    return Number(value);
}

function parseCommand(text: string): ParsedCommand {
    const [token, id, rawT0, rawTR] = text.trim().split(/\s+/);
    if (token === PING_TOKEN) {
        const t0 = parseTimestamp(rawT0);
        if (id && t0 !== undefined) return { kind: 'ping', id, t0 };
    } else if (token === PONG_TOKEN) {
        const t0 = parseTimestamp(rawT0);
        const tR = parseTimestamp(rawTR);
        if (id && t0 !== undefined && tR !== undefined) return { kind: 'pong', id, t0, tR };
    }
    return { kind: 'none' };
}

/** The sequence part of a stream id (`<ms>-<seq>`). */
function seqOf(id: string): number {
    return Number(id.split('-')[1]);
}

/** Orders two stream ids chronologically. */
function compareStreamIds(a: string, b: string): number {
    const [aMs = 0, aSeq = 0] = a.split('-').map(Number);
    const [bMs = 0, bSeq = 0] = b.split('-').map(Number);
    return aMs !== bMs ? aMs - bMs : aSeq - bSeq;
}

/** The id of the first message missing between `prev` and `current`, or `undefined` when contiguous. */
function gapId(prev: StoredMessage, current: StoredMessage): string | undefined {
    if (seqOf(current.id) - seqOf(prev.id) <= 1) return undefined;
    return `${prev.id.split('-')[0]}-${seqOf(prev.id) + 1}`;
}

export class ChatStream {
    readonly #hub: BuilderHub;
    readonly #maxMessages: number;
    readonly #unsubscribe: () => void;

    #getSelfId: () => string | undefined = () => undefined;
    #stored = $state<StoredMessage[]>([]);
    #lastSeenId: string | undefined;
    #lastReadId = $state<string | undefined>(undefined);

    constructor(hub: BuilderHub, options: ChatStreamOptions = {}) {
        this.#hub = hub;
        this.#maxMessages = options.maxMessages ?? 500;
        this.#unsubscribe = hub.on(CHAT_FRAME_TYPE, (frame) => this.#handleFrame(frame));
    }

    /** The current user's id, resolved through the bound source; `undefined` until bound/resolved. */
    get selfId(): string | undefined {
        return this.#getSelfId();
    }

    /** Binds the reactive source of the current user's id (typically the auth context). */
    bindSelfId(getSelfId: () => string | undefined): void {
        this.#getSelfId = getSelfId;
    }

    /** Reactive, ordered, de-duplicated message list, with synthetic gap markers interleaved. */
    get messages(): readonly ChatMessage[] {
        const out: ChatMessage[] = [];
        let prev: StoredMessage | undefined;
        for (const message of this.#stored) {
            const gap = prev && gapId(prev, message);
            if (gap) out.push({ kind: 'gap', id: gap });
            out.push(message);
            prev = message;
        }
        return out;
    }

    /** Number of messages newer than the last {@link markAllRead} call. Reactive. */
    get unreadCount(): number {
        const lastReadId = this.#lastReadId;
        if (!lastReadId) return this.#stored.length;
        let count = 0;
        for (let i = this.#stored.length - 1; i >= 0; i--) {
            if (compareStreamIds(this.#stored[i]!.id, lastReadId) <= 0) break;
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
        this.#lastReadId = this.#stored.at(-1)?.id;
    }

    /**
     * Sends a chat message. The `@ping` command (when compiled in) starts a latency probe instead
     * of sending literal text. Buffered by the hub's socket if currently disconnected.
     */
    send(text: string): void {
        const trimmed = text.trim();
        if (!trimmed) return;
        if (this.#tryHandleCommand(trimmed)) return;
        this.#hub.send(encodeChatRequest(trimmed));
    }

    /** Unsubscribes from the hub. The hub (and its socket) live on. */
    dispose(): void {
        this.#unsubscribe();
    }

    // Handles a typed command (currently `@ping`, when compiled in), sending its encoded form itself.
    // Returns true when the input was a command; false for ordinary text the caller should send as-is.
    #tryHandleCommand(text: string): boolean {
        if (import.meta.env.VITE_CHAT_CMD_PING && text.toLowerCase() === PING_TOKEN) {
            const self = this.selfId;
            if (self) this.#hub.send(encodeChatRequest(`${PING_TOKEN} ${self} ${Date.now()}`));
            return true;
        }
        return false;
    }

    #handleFrame(frame: ServerFrame): void {
        const now = Date.now();
        const additions: StoredMessage[] = [];
        for (const comment of parseChatComments(frame)) {
            if (this.#lastSeenId && compareStreamIds(comment.id, this.#lastSeenId) <= 0) continue;
            // Advance the mark even for suppressed comments (e.g. another user's pong): they still
            // consumed a stream id, so a redelivery must be dropped like any other.
            this.#lastSeenId = comment.id;
            const message = this.#handleComment(comment, now);
            if (message) additions.push(message);
        }
        if (additions.length === 0) return;

        const merged = [...this.#stored, ...additions];
        if (merged.length > this.#maxMessages) {
            merged.splice(0, merged.length - this.#maxMessages);
        }
        this.#stored = merged;
    }

    // Processes a received comment: may auto-reply (peer ping), and returns the message to store,
    // or `null` to suppress it (e.g. a pong not addressed to us).
    #handleComment(comment: ChatComment, now: number): StoredMessage | null {
        const { id, from } = comment;
        if (import.meta.env.VITE_CHAT_CMD_PING) {
            const command = parseCommand(comment.text);
            const self = this.selfId;
            if (command.kind === 'ping') {
                if (from === self) {
                    // Our own ping echoed back: now - t0 is our server round-trip.
                    return { kind: 'ping', id, from, selfMs: now - command.t0 };
                }
                // A peer's ping: reply so they can measure the full round-trip, and show it.
                this.#hub.send(encodeChatRequest(`${PONG_TOKEN} ${command.id} ${command.t0} ${now}`));
                return { kind: 'ping', id, from };
            }
            if (command.kind === 'pong') {
                if (from === self) {
                    // Our own pong echoed back: now - tR is our server round-trip.
                    return { kind: 'pong', id, from, roundTripMs: now - command.tR };
                }
                if (command.id === self) {
                    // A peer answered our ping (its id is our user id): now - t0 is the full round-trip.
                    return { kind: 'pong', id, from, roundTripMs: now - command.t0 };
                }
                return null;
            }
        }

        return { kind: 'text', id, from, text: comment.text };
    }
}
