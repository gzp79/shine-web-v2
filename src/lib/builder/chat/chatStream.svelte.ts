import { logAPI } from '#lib/loggers';
import { CHAT_CMD_BURST, CHAT_CMD_PING, CHAT_CMD_STORM } from '#lib/utils';
import type { ServerFrame } from '../hub.svelte';
import type { StreamHub, StreamSubscription } from '../streamHub';
import { type ChatCommands, type ChatDisplay, type ChatPresentation, createChatCommands } from './chatCommands';
import { type ArrivedMessage, type ChatEntry, ChatReplica } from './chatReplica';

/** The stream of the one room everybody shares. */
export const CHAT_STREAM_ID = 'chat:global';

/** Wait before subscribing again to a stream the server could not serve. */
const RESUBSCRIBE_DELAY_MS = 5000;

/** Where the chat stands: `live` once the room is synced and messages can be sent. */
export type ChatConnectionState = 'connecting' | 'syncing' | 'live' | 'reconnecting' | 'unsynced';

/** A message of the room with the way it shows. */
export type ChatItem = ChatEntry & { display: ChatDisplay };

/** Annotations are pruned once there are more than this many, to the messages still in the room. */
const MAX_ANNOTATIONS = 400;

const TEXT_DISPLAY: ChatDisplay = { kind: 'text' };

export type ChatStreamOptions = {
    streamId?: string;
    /** The dev commands; by default the ones the build enables. */
    commands?: ChatCommands;
    /** Makes the command ids of the messages sent. */
    newCommandId?: () => string;
    resubscribeDelayMs?: number;
};

/**
 * The shared chat room: the messages, whether there are unread ones, and sending. Follows the
 * connection of the stream hub; subscribes on {@link start} and unsubscribes on {@link destroy}.
 */
export class ChatStream {
    readonly #subscription: StreamSubscription;
    readonly #newCommandId: () => string;
    readonly #resubscribeDelayMs: number;
    readonly #commands: ChatCommands;

    // How the messages that arrived live as a dev command show. Plain on purpose: it is read through
    // `#revision`, which changes whenever it does.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    readonly #annotations = new Map<string, ChatPresentation>();

    #replica: ChatReplica | null = null;
    #retryTimer: ReturnType<typeof setTimeout> | null = null;
    #destroyed = false;

    // The replica is a plain object: `#revision` tells when its messages changed.
    #revision = $state(0);
    #state = $state<ChatConnectionState>('connecting');
    #selfId = $state<string | null>(null);
    #hasUnread = $state(false);

    readonly #messages = $derived.by<readonly ChatItem[]>(() => {
        void this.#revision;
        const items: ChatItem[] = [];
        for (const entry of this.#replica?.view() ?? []) {
            const presentation = this.#annotations.get(entry.id) ?? this.#commands.describe(entry.text);
            if (presentation !== 'hide') items.push({ ...entry, display: presentation });
        }
        return items;
    });

    constructor(hub: StreamHub, options: ChatStreamOptions = {}) {
        this.#newCommandId = options.newCommandId ?? (() => crypto.randomUUID());
        this.#resubscribeDelayMs = options.resubscribeDelayMs ?? RESUBSCRIBE_DELAY_MS;
        this.#commands =
            options.commands ??
            createChatCommands({ ping: CHAT_CMD_PING, burst: CHAT_CMD_BURST, storm: CHAT_CMD_STORM });

        this.#subscription = hub.createSubscription(options.streamId ?? CHAT_STREAM_ID, (userId) => {
            const replica = new ChatReplica(userId);
            this.#replica = replica;
            this.#selfId = userId;
            return {
                connected: () => {
                    replica.resync();
                    this.#state = 'syncing';
                },
                disconnected: () => {
                    this.#clearRetry();
                    this.#state = 'reconnecting';
                },
                frame: (frame) => this.#onFrame(replica, frame)
            };
        });
    }

    /** The messages of the room, oldest first, with the ones not confirmed yet last. Reactive. */
    get messages(): readonly ChatItem[] {
        return this.#messages;
    }

    get state(): ChatConnectionState {
        return this.#state;
    }

    /** Messages can be sent. */
    get canSend(): boolean {
        return this.#state === 'live';
    }

    /** The id of the current user, known once connected. */
    get selfId(): string | null {
        return this.#selfId;
    }

    /** Messages of other users arrived since they were last marked read. */
    get hasUnread(): boolean {
        return this.#hasUnread;
    }

    markAllRead(): void {
        this.#hasUnread = false;
    }

    /** Subscribes to the room. */
    start(): void {
        this.#destroyed = false;
        this.#subscribe();
    }

    /**
     * Sends a message, or runs the dev command it names. Returns false if nothing was sent: not live,
     * or the text is not acceptable.
     */
    send(text: string): boolean {
        const trimmed = text.trim();
        if (!trimmed || this.#state !== 'live') return false;
        if (this.#commands.run(trimmed, { selfId: this.#selfId, send: (plain) => void this.#sendText(plain) })) {
            return true;
        }
        return this.#sendText(trimmed);
    }

    /** Leaves the room. */
    destroy(): void {
        this.#destroyed = true;
        this.#clearRetry();
        this.#subscription.unsubscribe();
    }

    #onFrame(replica: ChatReplica, frame: ServerFrame): void {
        const result = replica.handle(frame);
        if (result.changed) this.#revision++;

        if (replica.status === 'live') {
            this.#state = 'live';
        } else if (replica.status === 'unsynced') {
            this.#state = 'unsynced';
            this.#retryLater(replica);
        } else {
            this.#state = 'syncing';
        }

        this.#present(result.arrived);
        for (const { commandId, command } of result.resend) this.#subscription.sendCommand(commandId, command);
        if (result.resubscribe) this.#subscribe();
    }

    /** Lets the dev commands react to the messages that arrived live, and tracks what is unread. */
    #present(arrived: readonly ArrivedMessage[]): void {
        if (arrived.length === 0) return;
        const now = Date.now();
        let annotated = false;
        for (const message of arrived) {
            const presentation = this.#commands.arrive({
                message,
                selfId: this.#selfId,
                now,
                send: (plain) => void this.#sendText(plain)
            });
            if (presentation === 'hide' || presentation.kind !== TEXT_DISPLAY.kind) {
                this.#annotations.set(message.id, presentation);
                annotated = true;
            }
            if (presentation !== 'hide' && message.from !== this.#selfId) this.#hasUnread = true;
        }
        if (annotated) {
            this.#pruneAnnotations();
            this.#revision++;
        }
    }

    #pruneAnnotations(): void {
        if (this.#annotations.size <= MAX_ANNOTATIONS) return;
        const inRoom = (this.#replica?.view() ?? []).map((entry) => entry.id);
        for (const id of [...this.#annotations.keys()]) {
            if (!inRoom.includes(id)) this.#annotations.delete(id);
        }
    }

    /** Sends plain text as a message of the user; false if it could not be sent. */
    #sendText(text: string): boolean {
        const replica = this.#replica;
        if (!replica || this.#state !== 'live') return false;

        const outgoing = replica.submit(this.#newCommandId(), text);
        if (!outgoing) return false;
        this.#revision++;
        if (!this.#subscription.sendCommand(outgoing.commandId, outgoing.command)) {
            replica.discard(outgoing.commandId);
            this.#revision++;
            return false;
        }
        return true;
    }

    #subscribe(): void {
        this.#subscription.subscribe().catch((error: unknown) => logAPI.error('[chat] subscribe failed', error));
    }

    /** Asks for the room again after a pause, unless something else already did. */
    #retryLater(replica: ChatReplica): void {
        if (this.#retryTimer !== null || this.#destroyed) return;
        this.#retryTimer = setTimeout(() => {
            this.#retryTimer = null;
            if (this.#destroyed || replica.status !== 'unsynced') return;
            replica.resync();
            this.#state = 'syncing';
            this.#subscribe();
        }, this.#resubscribeDelayMs);
    }

    #clearRetry(): void {
        if (this.#retryTimer !== null) clearTimeout(this.#retryTimer);
        this.#retryTimer = null;
    }
}
