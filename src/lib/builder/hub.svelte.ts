import { config } from '#config';
import { onDestroy } from 'svelte';
import { logAPI } from '#lib/loggers';
import { createContext } from '#lib/ui/utils';
import { ResilientWebSocket, type SocketStatus } from './resilientWebSocket.svelte';

/**
 * A decoded server frame: an object carrying a `type` discriminator alongside its
 * payload fields. The hub routes on `type`; each consumer validates its own payload.
 */
export type ServerFrame = { type: string } & Record<string, unknown>;

/** Handles a single frame of a subscribed type. */
export type FrameHandler = (frame: ServerFrame) => void;

/** Runs when the server accepted the connection; `userId` is the authenticated user. */
export type ConnectedHandler = (userId: string) => void;

/** Runs when a connection that had been accepted is gone. */
export type DisconnectedHandler = () => void;

export type BuilderHubOptions = {
    /** Override the websocket endpoint. Defaults to the configured builder WS url. */
    url?: string;
};

/** Builds the `wss://.../builder/api/connect` endpoint from the configured builder WS base url. */
export function builderHubUrl(): string {
    const base = config.builderWSUrl.replace(/^http/, 'ws').replace(/\/$/, '');
    return `${base}/api/connect`;
}

/** Close code the server uses when it drops a connection; the reason carries the drop's name. */
const DROPPED_CLOSE_CODE = 4000;
/** Close reason of a connection superseded by a newer one of the same user. */
const REPLACED_REASON = 'replaced';

/**
 * The user's connection to the builder hub (`docs/services/builder/hub.md` in `shine-services`).
 * Reports the connection state and the authenticated user id, delivers server frames by their
 * `type`, and notifies consumers when a connection is accepted or ends.
 */
export class BuilderHub {
    readonly #socket: ResilientWebSocket;
    #userId = $state<string | null>(null);
    #replaced = $state(false);
    // Plain collections on purpose: handlers are never read reactively.
    /* eslint-disable svelte/prefer-svelte-reactivity */
    readonly #handlers = new Map<string, Set<FrameHandler>>();
    readonly #connectedHandlers = new Set<ConnectedHandler>();
    readonly #disconnectedHandlers = new Set<DisconnectedHandler>();
    /* eslint-enable svelte/prefer-svelte-reactivity */

    constructor(options: BuilderHubOptions = {}) {
        this.#socket = new ResilientWebSocket({
            url: options.url ?? builderHubUrl(),
            // Never replay a frame into a later connection: its server-side state starts empty.
            queueWhileDisconnected: false,
            onMessage: (data) => this.#dispatch(data),
            onClose: (event) => this.#onClose(event)
        });
    }

    /** Reactive connection status; `connected` once the server has accepted the connection. */
    get status(): SocketStatus {
        // An open socket is not yet accepted: the server's `connected` frame completes the handshake.
        const status = this.#socket.status;
        return status === 'connected' && this.#userId === null ? 'connecting' : status;
    }

    /** True while frames can be sent: the handshake is complete. Reactive. */
    get isConnected(): boolean {
        return this.status === 'connected';
    }

    /** The authenticated user id from the `connected` frame, `null` while not connected. Reactive. */
    get userId(): string | null {
        return this.#userId;
    }

    /** True once the server replaced this connection with a newer one; the hub stays closed. Reactive. */
    get replaced(): boolean {
        return this.#replaced;
    }

    /** Delivers every frame of the given `type` to the handler until the returned function is called. */
    on(type: string, handler: FrameHandler): () => void {
        let handlers = this.#handlers.get(type);
        if (!handlers) {
            // eslint-disable-next-line svelte/prefer-svelte-reactivity -- see the registries above
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

    /** Calls the handler with the user id each time the server accepts a connection. */
    onConnected(handler: ConnectedHandler): () => void {
        this.#connectedHandlers.add(handler);
        return () => this.#connectedHandlers.delete(handler);
    }

    /** Calls the handler each time an accepted connection ends. */
    onDisconnected(handler: DisconnectedHandler): () => void {
        this.#disconnectedHandlers.add(handler);
        return () => this.#disconnectedHandlers.delete(handler);
    }

    /** Sends an encoded frame; returns false, sending nothing, unless {@link isConnected}. */
    send(frame: string): boolean {
        if (!this.isConnected) return false;
        return this.#socket.send(frame);
    }

    /** Opens the connection. Does nothing if already open or on the server. */
    connect(): void {
        this.#replaced = false;
        this.#socket.connect();
    }

    /** Closes the connection and stops reconnecting until {@link connect} is called. */
    close(): void {
        this.#socket.close();
        this.#connectionEnded();
    }

    /** Permanently disposes the connection and drops all subscriptions. */
    destroy(): void {
        this.close();
        this.#socket.destroy();
        this.#handlers.clear();
        this.#connectedHandlers.clear();
        this.#disconnectedHandlers.clear();
    }

    #onClose(event: CloseEvent): void {
        const replaced = event.code === DROPPED_CLOSE_CODE && event.reason === REPLACED_REASON;
        if (replaced) {
            // Reconnecting would only make the two connections keep replacing each other.
            logAPI.warn('[hub] connection replaced by a newer one, not reconnecting');
            this.#replaced = true;
            // Called from the socket's close handling, which then sees reconnection disabled.
            this.#socket.close();
        }
        this.#connectionEnded();
    }

    #connectionEnded(): void {
        // Nothing to report for a connection that never completed the handshake.
        if (this.#userId === null) return;
        this.#userId = null;
        this.#notify(this.#disconnectedHandlers);
    }

    #accept(userId: string): void {
        // The server sends it once per connection; a repeat must not restart the consumers.
        if (this.#userId !== null) return;
        this.#userId = userId;
        this.#notify(this.#connectedHandlers, userId);
    }

    #notify<Args extends unknown[]>(handlers: Set<(...args: Args) => void>, ...args: Args): void {
        // A throwing handler must not keep the others from learning of the change.
        for (const handler of [...handlers]) {
            try {
                handler(...args);
            } catch (error) {
                logAPI.error('[hub] lifecycle handler failed', error);
            }
        }
    }

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

        // The `connected` frame belongs to the hub: it completes the handshake and is never routed.
        if (frame.type === 'connected') {
            if (typeof frame.userId === 'string' && frame.userId !== '') this.#accept(frame.userId);
            return;
        }

        const handlers = this.#handlers.get(frame.type);
        if (!handlers) return;
        for (const handler of handlers) {
            handler(frame as ServerFrame);
        }
    }
}

const context = createContext<BuilderHub>('BuilderHubContext');

/**
 * Creates the hub, connects it and publishes it to descendants. Call once from the layout of an
 * authenticated region; the hub is destroyed with the providing component.
 */
export function provideBuilderHubContext(options?: BuilderHubOptions): BuilderHub {
    const hub = new BuilderHub(options);
    context.set(hub);
    hub.connect();
    onDestroy(() => hub.destroy());
    return hub;
}

/** Reads the hub published by {@link provideBuilderHubContext}. */
export function getBuilderHubContext(): BuilderHub {
    const hub = context.tryGet();
    if (!hub) {
        throw new Error('BuilderHubContext was not provided: call provideBuilderHubContext in the region layout.');
    }
    return hub;
}
