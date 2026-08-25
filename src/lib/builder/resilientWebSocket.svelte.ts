import { browser } from '$app/environment';
import { logAPI } from '@lib/loggers';

export const socketStatusList = ['idle', 'connecting', 'connected', 'reconnecting', 'closed'] as const;
export type SocketStatus = (typeof socketStatusList)[number];

export type ResilientWebSocketOptions = {
    /** The endpoint to connect to. May be a getter so the URL can be resolved lazily on each (re)connect. */
    url: string | (() => string);
    /** Optional websocket sub-protocols. */
    protocols?: string | string[];

    /** Called for every text frame received from the server. This is the "output" side of the connection. */
    onMessage?: (data: string) => void;
    /** Called whenever a connection is (re)established. Use it to (re)send any bootstrap/subscribe messages. */
    onOpen?: () => void;
    /** Called whenever the underlying socket closes (before a reconnect is scheduled). */
    onClose?: (event: CloseEvent) => void;
    /** Called on a low-level socket error. A close event usually follows. */
    onError?: (event: Event) => void;
    /** Called when reconnection is given up on after exhausting `maxReconnectAttempts`. */
    onGiveUp?: () => void;

    /** Maximum reconnect attempts before giving up (default: Infinity). */
    maxReconnectAttempts?: number;
    /** Base delay for the exponential backoff in ms (default: 500). */
    baseReconnectDelay?: number;
    /** Upper bound for a single backoff delay in ms (default: 10000). */
    maxReconnectDelay?: number;
    /** Buffer messages sent while disconnected and flush them on reconnect (default: true). */
    queueWhileDisconnected?: boolean;
    /** Maximum number of buffered outgoing messages; the oldest are dropped past this (default: 100). */
    maxQueueSize?: number;
};

/** WebSocket close code for an intentional, client-initiated shutdown. */
const NORMAL_CLOSURE = 1000;

/**
 * A resilient WebSocket wrapper with reactive status and automatic reconnection.
 *
 * It cleanly splits the async message flow into an input side (`send`) and an output
 * side (the `onMessage` callback), so the transport is decoupled from any protocol on top of it.
 *
 * Resilience:
 * - Reconnects with exponential backoff + jitter on any unexpected close.
 * - Buffers outgoing messages while disconnected and flushes them once reconnected.
 * - Recovers immediately when the browser regains connectivity or the tab becomes active,
 *   instead of waiting out the current backoff delay.
 * - Never reconnects after an explicit `close()`/`destroy()`.
 * - SSR-safe: does nothing until connected in the browser.
 *
 * The instance is safe to create outside a component; it owns its own listeners and is torn
 * down via `destroy()`. `status` and friends are `$state`-backed and can be read reactively.
 */
export class ResilientWebSocket {
    readonly #options: Required<Omit<ResilientWebSocketOptions, 'protocols'>> &
        Pick<ResilientWebSocketOptions, 'protocols'>;

    #ws: WebSocket | null = null;
    #shouldReconnect = false;
    #reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    #queue: string[] = [];
    #listenersBound = false;

    #status = $state<SocketStatus>('idle');
    #attempts = $state(0);

    constructor(options: ResilientWebSocketOptions) {
        this.#options = {
            protocols: options.protocols,
            url: options.url,
            onMessage: options.onMessage ?? (() => {}),
            onOpen: options.onOpen ?? (() => {}),
            onClose: options.onClose ?? (() => {}),
            onError: options.onError ?? (() => {}),
            onGiveUp: options.onGiveUp ?? (() => {}),
            maxReconnectAttempts: options.maxReconnectAttempts ?? Number.POSITIVE_INFINITY,
            baseReconnectDelay: options.baseReconnectDelay ?? 500,
            maxReconnectDelay: options.maxReconnectDelay ?? 10000,
            queueWhileDisconnected: options.queueWhileDisconnected ?? true,
            maxQueueSize: options.maxQueueSize ?? 100
        };
    }

    /** Current connection state. Reactive. */
    get status(): SocketStatus {
        return this.#status;
    }

    /** True while a live connection is available for sending. Reactive. */
    get isConnected(): boolean {
        return this.#status === 'connected';
    }

    /** Number of consecutive reconnect attempts since the last successful connection. Reactive. */
    get reconnectAttempts(): number {
        return this.#attempts;
    }

    /** Number of messages currently buffered while disconnected. Reactive. */
    get pending(): number {
        return this.#queue.length;
    }

    /** Opens the connection (idempotent) and enables auto-reconnect. No-op outside the browser. */
    connect(): void {
        if (!browser) return;
        if (this.#shouldReconnect && this.#ws) return;

        this.#shouldReconnect = true;
        this.#bindRecoveryListeners();
        if (!this.#isPageActive()) return;
        this.#open();
    }

    /**
     * Sends a text message. If the socket is not connected it is buffered (when
     * `queueWhileDisconnected` is enabled) and flushed on the next successful connection.
     * @returns true if the message was written to the socket immediately.
     */
    send(data: string): boolean {
        if (this.#ws && this.#ws.readyState === WebSocket.OPEN) {
            this.#ws.send(data);
            return true;
        }

        if (this.#options.queueWhileDisconnected) {
            this.#queue.push(data);
            // Bound the buffer so a long outage cannot grow memory without limit.
            if (this.#queue.length > this.#options.maxQueueSize) {
                const dropped = this.#queue.length - this.#options.maxQueueSize;
                this.#queue.splice(0, dropped);
                logAPI.warn(`[ws] outgoing buffer full, dropped ${dropped} message(s)`);
            }
        } else {
            logAPI.warn('[ws] message dropped, socket not connected');
        }
        return false;
    }

    /** Closes the connection and disables reconnection. Can be reopened later with `connect()`. */
    close(code = NORMAL_CLOSURE, reason?: string): void {
        this.#shouldReconnect = false;
        this.#clearReconnectTimer();
        this.#unbindRecoveryListeners();
        this.#teardownSocket(code, reason);
        this.#status = 'closed';
    }

    /** Permanently disposes the connection and all listeners. */
    destroy(): void {
        this.close();
        this.#queue = [];
    }

    #open(): void {
        this.#clearReconnectTimer();
        this.#teardownSocket();

        const url = typeof this.#options.url === 'function' ? this.#options.url() : this.#options.url;
        this.#status = this.#attempts > 0 ? 'reconnecting' : 'connecting';

        let ws: WebSocket;
        try {
            ws = new WebSocket(url, this.#options.protocols);
        } catch (err) {
            logAPI.error('[ws] failed to construct socket', err);
            this.#scheduleReconnect();
            return;
        }
        this.#ws = ws;

        ws.onopen = () => {
            if (this.#ws !== ws) return;
            logAPI.log('[ws] connected');
            this.#attempts = 0;
            this.#status = 'connected';
            this.#flushQueue();
            this.#options.onOpen();
        };

        ws.onmessage = (event: MessageEvent) => {
            if (this.#ws !== ws) return;
            if (typeof event.data === 'string') {
                this.#options.onMessage(event.data);
            } else {
                logAPI.warn('[ws] ignoring non-text frame');
            }
        };

        ws.onerror = (event: Event) => {
            if (this.#ws !== ws) return;
            logAPI.warn('[ws] socket error');
            this.#options.onError(event);
        };

        ws.onclose = (event: CloseEvent) => {
            if (this.#ws !== ws) return;
            this.#ws = null;
            this.#options.onClose(event);

            if (this.#shouldReconnect) {
                this.#scheduleReconnect();
            } else {
                this.#status = 'closed';
            }
        };
    }

    #scheduleReconnect(): void {
        if (!this.#shouldReconnect) return;
        if (!this.#isPageActive()) {
            this.#clearReconnectTimer();
            this.#status = 'reconnecting';
            logAPI.log('[ws] reconnect paused while page is inactive');
            return;
        }

        if (this.#attempts >= this.#options.maxReconnectAttempts) {
            logAPI.error('[ws] reconnect limit reached, giving up');
            this.#shouldReconnect = false;
            this.#status = 'closed';
            this.#unbindRecoveryListeners();
            this.#options.onGiveUp();
            return;
        }

        const { baseReconnectDelay, maxReconnectDelay } = this.#options;
        const backoff = Math.min(baseReconnectDelay * Math.pow(2, this.#attempts), maxReconnectDelay);
        const delay = backoff + Math.random() * 0.2 * backoff;
        this.#attempts += 1;
        this.#status = 'reconnecting';

        logAPI.log(`[ws] reconnecting in ${Math.round(delay)}ms (attempt ${this.#attempts})`);
        this.#reconnectTimer = setTimeout(() => {
            this.#reconnectTimer = null;
            this.#open();
        }, delay);
    }

    /** Skips the current backoff and retries now (e.g. connectivity restored). */
    #reconnectNow(): void {
        if (!this.#shouldReconnect || this.isConnected) return;
        if (!this.#isPageActive()) {
            this.#clearReconnectTimer();
            return;
        }

        // A backgrounded tab can leave a handshake stuck in CONNECTING forever (some browsers
        // suspend it rather than failing it outright). `#open()` tears down any existing socket
        // before creating a new one, so it's always safe to force a fresh attempt here.
        logAPI.log('[ws] connectivity restored, reconnecting now');
        this.#clearReconnectTimer();
        this.#attempts = 0;
        this.#open();
    }

    #flushQueue(): void {
        if (!this.#ws || this.#ws.readyState !== WebSocket.OPEN) return;
        const queued = this.#queue;
        this.#queue = [];
        for (const message of queued) {
            this.#ws.send(message);
        }
    }

    #clearReconnectTimer(): void {
        if (this.#reconnectTimer !== null) {
            clearTimeout(this.#reconnectTimer);
            this.#reconnectTimer = null;
        }
    }

    #teardownSocket(code = NORMAL_CLOSURE, reason?: string): void {
        const ws = this.#ws;
        if (!ws) return;
        this.#ws = null;
        // Detach handlers first so the imminent close does not trigger a reconnect.
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close(code, reason);
        }
    }

    #isPageActive(): boolean {
        if (!browser) return false;
        // Focus (not just visibility) is unreliable: e.g. focusing the browser's own
        // url bar blurs the document while the tab is still visible and the socket
        // should keep reconnecting. Visibility alone tracks whether the tab is backgrounded.
        return document.visibilityState === 'visible';
    }

    readonly #onOnline = () => this.#reconnectNow();
    readonly #onVisibilityChange = () => this.#reconnectNow();

    #bindRecoveryListeners(): void {
        if (this.#listenersBound || !browser) return;
        this.#listenersBound = true;
        window.addEventListener('online', this.#onOnline);
        document.addEventListener('visibilitychange', this.#onVisibilityChange);
    }

    #unbindRecoveryListeners(): void {
        if (!this.#listenersBound) return;
        this.#listenersBound = false;
        window.removeEventListener('online', this.#onOnline);
        document.removeEventListener('visibilitychange', this.#onVisibilityChange);
    }
}
