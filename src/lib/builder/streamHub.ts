import { onDestroy } from 'svelte';
import { createContext } from '#lib/ui/utils';
import { type BuilderHub, type ServerFrame, getBuilderHubContext } from './hub.svelte';

/** Receives the frames of one stream and the connection changes around it. */
export interface StreamListener {
    frame(frame: ServerFrame): void;
    /** The connection is accepted and the stream is being subscribed. */
    connected(): void;
    /** The connection is gone; the subscription is restored on the next connect. */
    disconnected(): void;
}

/** One stream's subscription; the handle a scene or panel holds between `subscribe` and `unsubscribe`. */
export interface StreamSubscription {
    /** Subscribes, or asks the server to sync the stream again. Resolves once the request is sent, or the subscription ends. */
    subscribe(): Promise<void>;
    /** Sends a command (base64 of its postcard bytes); false if it could not be sent now. */
    sendCommand(commandId: string, command: string): boolean;
    unsubscribe(): void;
}

/**
 * The stream access a host gives its consumers (chat, the game scenes): subscriptions that follow
 * the connection. Mirrors the `StreamHub` contract of the game bundle.
 */
export interface StreamHub {
    readonly isConnected: boolean;
    /** `createListener` runs once, when the user id is first known, and its listener serves every reconnect. */
    createSubscription(streamId: string, createListener: (userId: string) => StreamListener): StreamSubscription;
}

/** The part of {@link BuilderHub} that {@link BuilderStreamHub} uses. */
export type StreamTransport = Pick<
    BuilderHub,
    'isConnected' | 'userId' | 'on' | 'onConnected' | 'onDisconnected' | 'send'
>;

const STREAM_FRAME_TYPES = [
    'streamSync',
    'streamCommands',
    'streamCheckpoint',
    'streamReset',
    'streamUnsynced',
    'streamNack',
    'streamSubscribeFailed'
] as const;

type Entry = {
    createListener: (userId: string) => StreamListener;
    listener: StreamListener | null;
    /** Callers of `subscribe` waiting for the connection. */
    waiting: (() => void)[];
};

/**
 * The stream subscriptions of one builder connection. Subscribes each stream again on every
 * (re)connect and delivers the stream frames to the listener of their `streamId`.
 */
export class BuilderStreamHub implements StreamHub {
    readonly #transport: StreamTransport;
    readonly #streams = new Map<string, Entry>();
    readonly #detach: (() => void)[] = [];

    constructor(transport: StreamTransport) {
        this.#transport = transport;
        this.#detach.push(
            transport.onConnected((userId) => this.#onConnected(userId)),
            transport.onDisconnected(() => this.#onDisconnected())
        );
        for (const type of STREAM_FRAME_TYPES) {
            this.#detach.push(transport.on(type, (frame) => this.#route(frame)));
        }
    }

    get isConnected(): boolean {
        return this.#transport.isConnected;
    }

    createSubscription(streamId: string, createListener: (userId: string) => StreamListener): StreamSubscription {
        const entry: Entry = { createListener, listener: null, waiting: [] };
        const isCurrent = (): boolean => this.#streams.get(streamId) === entry;

        return {
            subscribe: () => {
                const current = this.#streams.get(streamId);
                if (current && current !== entry) {
                    return Promise.reject(new Error(`Stream '${streamId}' is already subscribed.`));
                }
                const userId = this.#transport.userId;
                if (current === entry && userId !== null) {
                    this.#sendSubscribe(streamId);
                    return Promise.resolve();
                }
                this.#streams.set(streamId, entry);
                if (userId !== null) {
                    this.#activate(streamId, entry, userId);
                    return Promise.resolve();
                }
                return new Promise<void>((resolve) => entry.waiting.push(resolve));
            },
            sendCommand: (commandId, command) =>
                isCurrent() && this.#send({ type: 'streamCommand', streamId, commandId, command }),
            unsubscribe: () => {
                if (!isCurrent()) return;
                this.#streams.delete(streamId);
                this.#release(entry);
                this.#send({ type: 'streamUnsubscribe', streamId });
            }
        };
    }

    /** Stops listening to the connection and ends every subscription. */
    destroy(): void {
        for (const detach of this.#detach) detach();
        this.#detach.length = 0;
        for (const entry of this.#streams.values()) this.#release(entry);
        this.#streams.clear();
    }

    #onConnected(userId: string): void {
        for (const [streamId, entry] of this.#streams) this.#activate(streamId, entry, userId);
    }

    #onDisconnected(): void {
        for (const entry of this.#streams.values()) entry.listener?.disconnected();
    }

    #route(frame: ServerFrame): void {
        const streamId = frame.streamId;
        if (typeof streamId !== 'string') return;
        this.#streams.get(streamId)?.listener?.frame(frame);
    }

    #activate(streamId: string, entry: Entry, userId: string): void {
        entry.listener ??= entry.createListener(userId);
        this.#sendSubscribe(streamId);
        entry.listener.connected();
        this.#release(entry);
    }

    #sendSubscribe(streamId: string): void {
        this.#send({ type: 'streamSubscribe', streamId });
    }

    #release(entry: Entry): void {
        const waiting = entry.waiting;
        entry.waiting = [];
        for (const resolve of waiting) resolve();
    }

    #send(frame: object): boolean {
        return this.#transport.send(JSON.stringify(frame));
    }
}

const context = createContext<BuilderStreamHub>('BuilderStreamHubContext');

/**
 * Creates the stream hub over the builder hub of the context and publishes it to descendants.
 * Call once, below the provider of the builder hub; it ends with the providing component.
 */
export function provideBuilderStreamHubContext(): BuilderStreamHub {
    const streams = new BuilderStreamHub(getBuilderHubContext());
    context.set(streams);
    onDestroy(() => streams.destroy());
    return streams;
}

/** Reads the stream hub published by {@link provideBuilderStreamHubContext}. */
export function getBuilderStreamHubContext(): BuilderStreamHub {
    const streams = context.tryGet();
    if (!streams) {
        throw new Error(
            'BuilderStreamHubContext was not provided: call provideBuilderStreamHubContext in the region layout.'
        );
    }
    return streams;
}
