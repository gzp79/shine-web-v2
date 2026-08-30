import { logChat } from '@lib/loggers';
import type { BuilderHub, ServerFrame } from '../hub';
import type { ChatMessage, PingMessage, PongMessage, TextMessage } from './chatMessages';
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

// Client-only stress-test commands, also encoded inside plain chat text (the server is a dumb
// broadcast relay, see above). Both are capped so a typo can't fire off an unbounded flood.
//
//   @burst <n>   the initiator sends n plain messages itself — a single-sender load test.
//   @storm <n>   the initiator broadcasts one trigger; every client that sees it (the initiator
//                included, via its own echo) answers with n plain messages — an amplification
//                test that produces clients×n traffic. Responses are plain text, never a command
//                token, so they cannot re-trigger a storm.
const BURST_TOKEN = '@burst';
const STORM_TOKEN = '@storm';
const MAX_STRESS_MESSAGES = 200;

// Parses the single count argument shared by @burst/@storm; undefined for anything that is not a
// positive integer within [1, MAX_STRESS_MESSAGES].
function parseStressCount(args: string[]): number | undefined {
    if (args.length !== 1 || !/^\d+$/.test(args[0]!)) return undefined;
    const count = Number(args[0]);
    return count >= 1 && count <= MAX_STRESS_MESSAGES ? count : undefined;
}

// Recognises an incoming `@storm <n>` trigger frame, returning its (validated) count or undefined.
function parseStormTrigger(text: string): number | undefined {
    const [token, ...args] = text.trim().split(/\s+/);
    return token === STORM_TOKEN ? parseStressCount(args) : undefined;
}

type ChatCommandContext = {
    args: string[];
    selfId: string | undefined;
    send: (text: string) => void;
};

// A client-side chat command, identified by its leading whitespace-separated token. `run` validates
// its own arguments and ignores (logs) malformed input. To add a command, append an entry — the
// dispatch in `#tryHandleCommand` needs no changes.
type ChatCommand = {
    token: string;
    run: (context: ChatCommandContext) => void;
};

const CHAT_COMMANDS: ChatCommand[] = [
    ...(import.meta.env.VITE_CHAT_CMD_PING
        ? [
            {
                token: PING_TOKEN,
                run: ({ args, selfId, send }) => {
                    if (args.length > 0) {
                        logChat.warn('Ignoring invalid @ping command: unexpected parameters');
                        return;
                    }
                    if (!selfId) {
                        logChat.warn('Ignoring @ping command: current user id is not resolved yet');
                        return;
                    }
                    send(`${PING_TOKEN} ${selfId} ${Date.now()}`);
                }
            } satisfies ChatCommand
        ]
        : []),
    ...(import.meta.env.VITE_CHAT_CMD_BURST
        ? [
            {
                token: BURST_TOKEN,
                run: ({ args, send }) => {
                    const count = parseStressCount(args);
                    if (count === undefined) {
                        logChat.warn('Ignoring invalid @burst command: expected a count between 1 and 200');
                        return;
                    }
                    // The initiator floods the messages itself; they echo back as ordinary text.
                    for (let i = 1; i <= count; i++) send(`burst ${i}/${count}`);
                }
            } satisfies ChatCommand
        ]
        : []),
    ...(import.meta.env.VITE_CHAT_CMD_STORM
        ? [
            {
                token: STORM_TOKEN,
                run: ({ args, send }) => {
                    const count = parseStressCount(args);
                    if (count === undefined) {
                        logChat.warn('Ignoring invalid @storm command: expected a count between 1 and 200');
                        return;
                    }
                    // Fire a single trigger; every client answers on receipt (see #handleComment).
                    send(`${STORM_TOKEN} ${count}`);
                }
            } satisfies ChatCommand
        ]
        : [])
];

type ParsedCommand =
    { kind: 'ping'; id: string; t0: number } |
    { kind: 'pong'; id: string; t0: number; tR: number } |
    { kind: 'none' };

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

type IncomingContext = {
    comment: ChatComment;
    selfId: string | undefined;
    /** The receiver's clock (epoch ms) captured once per frame, shared across the batch. */
    now: number;
    send: (text: string) => void;
};

// The receive-side counterpart to CHAT_COMMANDS: a client-side reaction to an incoming comment,
// matched by inspecting its text. `handle` returns the message to store, `null` to suppress it
// (recognised but nothing to show, e.g. a pong between other users), or `undefined` when the
// comment isn't this command's concern so the next entry — and finally plain text — applies.
type IncomingCommand = {
    handle: (context: IncomingContext) => StoredMessage | null | undefined;
};

const INCOMING_COMMANDS: IncomingCommand[] = [
    ...(import.meta.env.VITE_CHAT_CMD_PING
        ? [
            {
                handle: ({ comment, selfId, now, send }) => {
                    const command = parseCommand(comment.text);
                    const { id, from } = comment;
                    if (command.kind === 'ping') {
                        if (from === selfId) {
                            // Our own ping echoed back: now - t0 is our server round-trip.
                            return { kind: 'ping', id, from, selfMs: now - command.t0 };
                        }
                        // A peer's ping: reply so they can measure the full round-trip, and show it.
                        send(`${PONG_TOKEN} ${command.id} ${command.t0} ${now}`);
                        return { kind: 'ping', id, from };
                    }
                    if (command.kind === 'pong') {
                        if (from === selfId) {
                            // Our own pong echoed back: now - tR is our server round-trip.
                            return { kind: 'pong', id, from, roundTripMs: now - command.tR };
                        }
                        if (command.id === selfId) {
                            // A peer answered our ping (its id is our user id): now - t0 is the full round-trip.
                            return { kind: 'pong', id, from, roundTripMs: now - command.t0 };
                        }
                        return null;
                    }
                    return undefined;
                }
            } satisfies IncomingCommand
        ]
        : []),
    ...(import.meta.env.VITE_CHAT_CMD_STORM
        ? [
            {
                handle: ({ comment, send }) => {
                    const count = parseStormTrigger(comment.text);
                    if (count === undefined) return undefined;
                    // Every client answering (initiator included) is what amplifies the load; the
                    // plain replies never match a command token, so they cannot re-trigger a storm.
                    for (let i = 1; i <= count; i++) send(`storm ${i}/${count}`);
                    return { kind: 'text', id: comment.id, from: comment.from, text: comment.text };
                }
            } satisfies IncomingCommand
        ]
        : [])
];

// A Redis stream id is `<ms>-<seq>`: `ms` is the entry's server millisecond timestamp and `seq`
// is a within-millisecond counter that resets to 0 whenever `ms` advances. Both parts matter for
// ordering and for gap detection — `seq` alone is ambiguous across millisecond buckets.
type StreamId = { ms: number; seq: number };

function parseStreamId(id: string): StreamId {
    const [ms = 0, seq = 0] = id.split('-').map(Number);
    return { ms, seq };
}

/** Orders two stream ids chronologically. */
function compareStreamIds(a: string, b: string): number {
    const x = parseStreamId(a);
    const y = parseStreamId(b);
    return x.ms !== y.ms ? x.ms - y.ms : x.seq - y.seq;
}

/**
 * The id of the first message missing between `prevId` and `currentId`, or `undefined` when they
 * are contiguous.
 *
 * Within a single millisecond bucket a gap is a `seq` jump greater than 1. Across buckets we can
 * only detect the leading part of a gap: since each new `ms` starts at `seq` 0, a current `seq`
 * greater than 0 means this bucket's earlier entries were missed. Entries dropped at the tail of
 * the previous bucket are unknowable (we never learn its final `seq`) and are not reported.
 */
function gapId(prevId: string, currentId: string): string | undefined {
    const prev = parseStreamId(prevId);
    const current = parseStreamId(currentId);
    if (current.ms === prev.ms) {
        return current.seq - prev.seq > 1 ? `${current.ms}-${prev.seq + 1}` : undefined;
    }
    return current.seq > 0 ? `${current.ms}-0` : undefined;
}

export class ChatStream {
    readonly #hub: BuilderHub;
    readonly #maxMessages: number;
    readonly #unsubscribe: () => void;

    #getSelfId: () => string | undefined = () => undefined;
    #stored = $state<ChatMessage[]>([]);
    #lastSeenId: string | undefined;
    #pendingGapId: string | undefined;
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
        return this.#stored;
    }

    /** Number of messages newer than the last {@link markAllRead} call. Reactive. */
    get unreadCount(): number {
        const lastReadId = this.#lastReadId;
        let count = 0;
        for (let i = this.#stored.length - 1; i >= 0; i--) {
            const message = this.#stored[i]!;
            if (lastReadId && compareStreamIds(message.id, lastReadId) <= 0) break;
            if (message.kind !== 'gap') count++;
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

    // Dispatches a typed command by its first whitespace-separated token. Returns true when the input
    // matched an enabled command (which handles its own sending and argument validation), so the caller
    // must not send it as literal text; false for ordinary text the caller should send as-is.
    #tryHandleCommand(text: string): boolean {
        const [token = '', ...args] = text.split(/\s+/);
        const command = CHAT_COMMANDS.find((c) => c.token === token.toLowerCase());
        if (!command) return false;

        command.run({ args, selfId: this.selfId, send: (t) => this.#hub.send(encodeChatRequest(t)) });
        return true;
    }

    #handleFrame(frame: ServerFrame): void {
        const now = Date.now();
        const additions: ChatMessage[] = [];
        for (const comment of parseChatComments(frame)) {
            // Skip out-of-order or already seen comments.
            if (this.#lastSeenId && compareStreamIds(comment.id, this.#lastSeenId) <= 0) continue;

            // Detect a gap between the last seen id and this comment. Remember the earliest gap
            // seen so far rather than emitting it now: a gap must sit *between* two visible
            // messages, and this comment may be suppressed (e.g. a peer↔peer pong). Advancing
            // over suppressed comments keeps the pending gap so it precedes the next real message.
            const gap = this.#lastSeenId ? gapId(this.#lastSeenId, comment.id) : undefined;
            if (gap && this.#pendingGapId === undefined) this.#pendingGapId = gap;
            this.#lastSeenId = comment.id;

            const message = this.#handleComment(comment, now);
            if (!message) continue;

            if (this.#pendingGapId !== undefined) {
                additions.push({ kind: 'gap', id: this.#pendingGapId });
                this.#pendingGapId = undefined;
            }
            additions.push(message);
        }
        if (additions.length === 0) return;

        const merged = [...this.#stored, ...additions];
        if (merged.length > this.#maxMessages) {
            merged.splice(0, merged.length - this.#maxMessages);
        }
        this.#stored = merged;
    }

    // Processes a received comment through the INCOMING_COMMANDS table: an entry may auto-reply
    // (peer ping, storm trigger) and returns the message to store or `null` to suppress it (e.g. a
    // pong not addressed to us). A comment no entry claims is stored as plain text.
    #handleComment(comment: ChatComment, now: number): StoredMessage | null {
        const context: IncomingContext = {
            comment,
            selfId: this.selfId,
            now,
            send: (text) => this.#hub.send(encodeChatRequest(text))
        };
        for (const command of INCOMING_COMMANDS) {
            const result = command.handle(context);
            if (result !== undefined) return result;
        }
        return { kind: 'text', id: comment.id, from: comment.from, text: comment.text };
    }
}
