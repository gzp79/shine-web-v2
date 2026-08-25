import { config } from '@config';
import { ResilientWebSocket, type SocketStatus } from './resilientWebSocket.svelte';

/**
 * A decoded server frame: an object carrying a `type` discriminator alongside its
 * payload fields. The hub routes on `type`; each channel validates its own payload.
 */
export type ServerFrame = { type: string } & Record<string, unknown>;

/** Handles a single frame of a subscribed type. */
export type FrameHandler = (frame: ServerFrame) => void;

export type BuilderHubOptions = {
    /** Override the websocket endpoint. Defaults to the configured builder WS url. */
    url?: string;
};

/** Builds the `wss://.../builder/api/connect` endpoint from the configured builder WS base url. */
export function builderHubUrl(): string {
    const base = config.builderWSUrl.replace(/^http/, 'ws').replace(/\/$/, '');
    return `${base}/api/connect`;
}

/**
 * The shared, multiplexed transport for the builder connection.
 *
 * Owns a single {@link ResilientWebSocket} and fans incoming frames out to channels by
 * their `type` discriminator. Channels ({@link import('./chat/chatStream.svelte').ChatStream}
 * and future siblings) subscribe with {@link on} and send already-encoded frames with
 * {@link send}; they never touch the socket. The hub is long-lived — opened once per region
 * and kept alive by the socket's own reconnect logic, independent of which channels exist.
 *
 * It knows only the frame envelope (the `type` field). Per-channel payload schemas live in
 * the channels, so the transport stays free of any single feature's wire format.
 */
export class BuilderHub {
    readonly #socket: ResilientWebSocket;
    readonly #handlers = new Map<string, Set<FrameHandler>>();

    constructor(options: BuilderHubOptions = {}) {
        this.#socket = new ResilientWebSocket({
            url: options.url ?? builderHubUrl(),
            onMessage: (data) => this.#dispatch(data)
        });
    }

    /** Reactive connection status. */
    get status(): SocketStatus {
        return this.#socket.status;
    }

    /** True while frames can be sent immediately. Reactive. */
    get isConnected(): boolean {
        return this.#socket.isConnected;
    }

    /**
     * Subscribes to frames of the given `type`. The handler runs for every matching frame
     * until the returned function is called. Multiple handlers may share a type.
     */
    on(type: string, handler: FrameHandler): () => void {
        let handlers = this.#handlers.get(type);
        if (!handlers) {
            handlers = new Set();
            this.#handlers.set(type, handlers);
        }
        handlers.add(handler);

        return () => {
            const set = this.#handlers.get(type);
            if (!set) return;
            set.delete(handler);
            if (set.size === 0) this.#handlers.delete(type);
        };
    }

    /** Sends an already-encoded frame. Buffered by the socket if currently disconnected. */
    send(frame: string): void {
        this.#socket.send(frame);
    }

    /** Opens the connection (idempotent). No-op on the server. */
    connect(): void {
        this.#socket.connect();
    }

    /** Closes the connection and disables reconnection. Can be reopened with {@link connect}. */
    close(): void {
        this.#socket.close();
    }

    /** Permanently disposes the connection and drops all subscriptions. */
    destroy(): void {
        this.#socket.destroy();
        this.#handlers.clear();
    }

    /** Parses a raw text frame and routes it to the handlers registered for its `type`. */
    #dispatch(raw: string): void {
        let parsed: unknown;
        try {
            parsed = JSON.parse(raw);
        } catch {
            return;
        }

        if (typeof parsed !== 'object' || parsed === null) return;
        const frame = parsed as Record<string, unknown>;
        if (typeof frame.type !== 'string') return;

        const handlers = this.#handlers.get(frame.type);
        if (!handlers) return;
        for (const handler of handlers) {
            handler(frame as ServerFrame);
        }
    }
}
