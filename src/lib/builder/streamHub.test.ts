import { describe, expect, test } from 'vitest';
import type { FrameHandler, ServerFrame } from './hub.svelte';
import { BuilderStreamHub, type StreamListener, type StreamTransport } from './streamHub';

const USER_ID = '11111111-2222-3333-4444-555555555555';
const STREAM = 'chat:global';

/** A transport the tests drive by hand. */
class FakeTransport implements StreamTransport {
    userId: string | null = null;
    sent: object[] = [];
    readonly #frames = new Map<string, FrameHandler[]>();
    readonly #connected: ((userId: string) => void)[] = [];
    readonly #disconnected: (() => void)[] = [];

    get isConnected(): boolean {
        return this.userId !== null;
    }

    on(type: string, handler: FrameHandler): () => void {
        this.#frames.set(type, [...(this.#frames.get(type) ?? []), handler]);
        return () =>
            this.#frames.set(
                type,
                (this.#frames.get(type) ?? []).filter((h) => h !== handler)
            );
    }
    onConnected(handler: (userId: string) => void): () => void {
        this.#connected.push(handler);
        return () => this.#connected.splice(this.#connected.indexOf(handler), 1);
    }
    onDisconnected(handler: () => void): () => void {
        this.#disconnected.push(handler);
        return () => this.#disconnected.splice(this.#disconnected.indexOf(handler), 1);
    }
    send(frame: string): boolean {
        if (!this.isConnected) return false;
        this.sent.push(JSON.parse(frame) as object);
        return true;
    }

    connect(userId = USER_ID): void {
        this.userId = userId;
        for (const handler of [...this.#connected]) handler(userId);
    }
    disconnect(): void {
        this.userId = null;
        for (const handler of [...this.#disconnected]) handler();
    }
    receive(frame: ServerFrame): void {
        for (const handler of this.#frames.get(frame.type) ?? []) handler(frame);
    }
}

type Recorded = { events: string[]; frames: ServerFrame[]; userIds: string[] };

function recorder(): { record: Recorded; create: (userId: string) => StreamListener } {
    const record: Recorded = { events: [], frames: [], userIds: [] };
    return {
        record,
        create: (userId) => {
            record.userIds.push(userId);
            return {
                connected: () => record.events.push('connected'),
                disconnected: () => record.events.push('disconnected'),
                frame: (frame) => record.frames.push(frame)
            };
        }
    };
}

describe('BuilderStreamHub', () => {
    test('reports the connection state of the transport', () => {
        const transport = new FakeTransport();
        const hub = new BuilderStreamHub(transport);
        expect(hub.isConnected).toBe(false);
        transport.connect();
        expect(hub.isConnected).toBe(true);
    });

    test('subscribes at once when already connected', async () => {
        const transport = new FakeTransport();
        transport.connect();
        const hub = new BuilderStreamHub(transport);
        const { record, create } = recorder();

        await hub.createSubscription(STREAM, create).subscribe();

        expect(transport.sent).toEqual([{ type: 'streamSubscribe', streamId: STREAM }]);
        expect(record.userIds).toEqual([USER_ID]);
        expect(record.events).toEqual(['connected']);
    });

    test('waits for the connection, then subscribes and resolves', async () => {
        const transport = new FakeTransport();
        const hub = new BuilderStreamHub(transport);
        const { record, create } = recorder();

        let resolved = false;
        const pending = hub
            .createSubscription(STREAM, create)
            .subscribe()
            .then(() => (resolved = true));
        await Promise.resolve();
        expect(resolved).toBe(false);
        expect(transport.sent).toEqual([]);

        transport.connect();
        await pending;

        expect(transport.sent).toEqual([{ type: 'streamSubscribe', streamId: STREAM }]);
        expect(record.events).toEqual(['connected']);
    });

    test('subscribes again on every reconnect and keeps the listener', async () => {
        const transport = new FakeTransport();
        const hub = new BuilderStreamHub(transport);
        const { record, create } = recorder();
        const subscribed = hub.createSubscription(STREAM, create).subscribe();
        transport.connect();
        await subscribed;

        transport.disconnect();
        transport.connect();

        expect(record.userIds).toEqual([USER_ID]);
        expect(record.events).toEqual(['connected', 'disconnected', 'connected']);
        expect(transport.sent).toEqual([
            { type: 'streamSubscribe', streamId: STREAM },
            { type: 'streamSubscribe', streamId: STREAM }
        ]);
    });

    test('asks for a new sync when subscribing an already subscribed stream', async () => {
        const transport = new FakeTransport();
        transport.connect();
        const hub = new BuilderStreamHub(transport);
        const subscription = hub.createSubscription(STREAM, recorder().create);
        await subscription.subscribe();

        await subscription.subscribe();

        expect(transport.sent).toEqual([
            { type: 'streamSubscribe', streamId: STREAM },
            { type: 'streamSubscribe', streamId: STREAM }
        ]);
    });

    test('rejects a second subscription to a stream that is already subscribed', async () => {
        const transport = new FakeTransport();
        transport.connect();
        const hub = new BuilderStreamHub(transport);
        await hub.createSubscription(STREAM, recorder().create).subscribe();

        await expect(hub.createSubscription(STREAM, recorder().create).subscribe()).rejects.toThrow('already');
    });

    test('delivers each stream frame to the listener of its stream id', async () => {
        const transport = new FakeTransport();
        transport.connect();
        const hub = new BuilderStreamHub(transport);
        const chat = recorder();
        const map = recorder();
        await hub.createSubscription(STREAM, chat.create).subscribe();
        await hub.createSubscription('pixel-map:demo', map.create).subscribe();

        const sync = { type: 'streamSync', streamId: STREAM, snapshot: null, commands: [] };
        transport.receive(sync);
        transport.receive({ type: 'streamNack', streamId: 'pixel-map:demo', commandId: 'c', reason: 'busy' });
        transport.receive({ type: 'streamSync', streamId: 'chat:other', snapshot: null, commands: [] });
        transport.receive({ type: 'streamSync', snapshot: null, commands: [] });

        expect(chat.record.frames).toEqual([sync]);
        expect(map.record.frames.map((f) => f.type)).toEqual(['streamNack']);
    });

    test('delivers every kind of stream frame', async () => {
        const transport = new FakeTransport();
        transport.connect();
        const hub = new BuilderStreamHub(transport);
        const { record, create } = recorder();
        await hub.createSubscription(STREAM, create).subscribe();

        const types = [
            'streamSync',
            'streamCommands',
            'streamCheckpoint',
            'streamReset',
            'streamUnsynced',
            'streamNack',
            'streamSubscribeFailed'
        ];
        for (const type of types) transport.receive({ type, streamId: STREAM });

        expect(record.frames.map((f) => f.type)).toEqual(types);
    });

    test('tells the listener when the connection is lost', async () => {
        const transport = new FakeTransport();
        transport.connect();
        const hub = new BuilderStreamHub(transport);
        const { record, create } = recorder();
        await hub.createSubscription(STREAM, create).subscribe();

        transport.disconnect();

        expect(record.events).toEqual(['connected', 'disconnected']);
    });

    test('sends commands of a subscribed stream only while connected', async () => {
        const transport = new FakeTransport();
        transport.connect();
        const hub = new BuilderStreamHub(transport);
        const subscription = hub.createSubscription(STREAM, recorder().create);

        expect(subscription.sendCommand('c0', 'AA==')).toBe(false);

        await subscription.subscribe();
        expect(subscription.sendCommand('c1', 'AA==')).toBe(true);
        expect(transport.sent.at(-1)).toEqual({
            type: 'streamCommand',
            streamId: STREAM,
            commandId: 'c1',
            command: 'AA=='
        });

        transport.disconnect();
        expect(subscription.sendCommand('c2', 'AA==')).toBe(false);
    });

    test('unsubscribe tells the server and stops the delivery', async () => {
        const transport = new FakeTransport();
        transport.connect();
        const hub = new BuilderStreamHub(transport);
        const { record, create } = recorder();
        const subscription = hub.createSubscription(STREAM, create);
        await subscription.subscribe();

        subscription.unsubscribe();
        transport.receive({ type: 'streamCommands', streamId: STREAM, commands: [] });

        expect(transport.sent.at(-1)).toEqual({ type: 'streamUnsubscribe', streamId: STREAM });
        expect(record.frames).toEqual([]);
        expect(subscription.sendCommand('c', 'AA==')).toBe(false);
    });

    test('an unsubscribed stream can be subscribed again', async () => {
        const transport = new FakeTransport();
        transport.connect();
        const hub = new BuilderStreamHub(transport);
        const first = hub.createSubscription(STREAM, recorder().create);
        await first.subscribe();
        first.unsubscribe();

        await expect(hub.createSubscription(STREAM, recorder().create).subscribe()).resolves.toBeUndefined();
    });

    test('unsubscribing before the connection releases the waiting subscribe', async () => {
        const transport = new FakeTransport();
        const hub = new BuilderStreamHub(transport);
        const subscription = hub.createSubscription(STREAM, recorder().create);
        const pending = subscription.subscribe();

        subscription.unsubscribe();

        await expect(pending).resolves.toBeUndefined();
    });

    test('does not subscribe a stream that was unsubscribed before the connection', () => {
        const transport = new FakeTransport();
        const hub = new BuilderStreamHub(transport);
        const subscription = hub.createSubscription(STREAM, recorder().create);
        void subscription.subscribe();
        subscription.unsubscribe();

        transport.connect();

        expect(transport.sent).toEqual([]);
    });

    test('destroy stops following the connection and releases waiting subscribes', async () => {
        const transport = new FakeTransport();
        const hub = new BuilderStreamHub(transport);
        const { record, create } = recorder();
        const pending = hub.createSubscription(STREAM, create).subscribe();

        hub.destroy();
        await expect(pending).resolves.toBeUndefined();
        transport.connect();
        transport.receive({ type: 'streamSync', streamId: STREAM });

        expect(transport.sent).toEqual([]);
        expect(record.frames).toEqual([]);
    });
});
