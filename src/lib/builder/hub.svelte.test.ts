import { config } from '#config';
import { testInEffectRoot } from '#testing';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { BuilderHub, builderHubUrl } from './hub.svelte';

// Minimal controllable fake WebSocket (see resilientWebSocket.svelte.test.ts for the full rationale).
class FakeWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;

    static instances: FakeWebSocket[] = [];
    static last(): FakeWebSocket {
        const ws = FakeWebSocket.instances.at(-1);
        if (!ws) throw new Error('no FakeWebSocket created');
        return ws;
    }

    readyState = FakeWebSocket.CONNECTING;
    sent: string[] = [];
    onopen: (() => void) | null = null;
    onmessage: ((event: { data: unknown }) => void) | null = null;
    onerror: ((event: unknown) => void) | null = null;
    onclose: ((event: { code: number; reason: string }) => void) | null = null;

    constructor(readonly url: string) {
        FakeWebSocket.instances.push(this);
    }

    send(data: string): void {
        this.sent.push(data);
    }
    close(): void {
        this.readyState = FakeWebSocket.CLOSED;
        this.onclose?.({ code: 1000, reason: '' });
    }
    serverClose(code: number, reason = ''): void {
        this.readyState = FakeWebSocket.CLOSED;
        this.onclose?.({ code, reason });
    }
    open(): void {
        this.readyState = FakeWebSocket.OPEN;
        this.onopen?.();
    }
    emit(frame: unknown): void {
        this.onmessage?.({ data: JSON.stringify(frame) });
    }
    emitRaw(data: string): void {
        this.onmessage?.({ data });
    }
}

const USER_ID = '11111111-2222-3333-4444-555555555555';
const CONNECTED = { type: 'connected', userId: USER_ID };

/** A hub whose socket is open and has received the server's `connected` frame. */
function connectedHub(): BuilderHub {
    const hub = new BuilderHub({ url: 'ws://test/connect' });
    hub.connect();
    FakeWebSocket.last().open();
    FakeWebSocket.last().emit(CONNECTED);
    return hub;
}

describe('builderHubUrl', () => {
    test('derives the ws connect endpoint from the configured builder ws url', () => {
        // Environment-independent: the http(s) base becomes a ws(s) url ending in the connect path.
        const url = builderHubUrl();
        const wsScheme = config.builderWSUrl.startsWith('https') ? 'wss://' : 'ws://';
        expect(url.startsWith(wsScheme)).toBe(true);
        expect(url.endsWith('/api/connect')).toBe(true);
        expect(url).not.toContain('//api/connect');
    });
});

describe('BuilderHub', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        FakeWebSocket.instances = [];
        vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    describe('frame routing', () => {
        test('routes frames to the handler registered for their type', () => {
            testInEffectRoot(() => {
                const hub = connectedHub();

                const sync: unknown[] = [];
                const ping: unknown[] = [];
                hub.on('streamSync', (frame) => sync.push(frame));
                hub.on('ping', (frame) => ping.push(frame));

                FakeWebSocket.last().emit({ type: 'streamSync', streamId: 'a' });
                FakeWebSocket.last().emit({ type: 'ping', id: 'x' });

                expect(sync).toEqual([{ type: 'streamSync', streamId: 'a' }]);
                expect(ping).toEqual([{ type: 'ping', id: 'x' }]);
                hub.destroy();
            });
        });

        test('fans a frame out to every handler of its type', () => {
            testInEffectRoot(() => {
                const hub = connectedHub();

                let a = 0;
                let b = 0;
                hub.on('ping', () => a++);
                hub.on('ping', () => b++);

                FakeWebSocket.last().emit({ type: 'ping', id: 'x' });
                expect([a, b]).toEqual([1, 1]);
                hub.destroy();
            });
        });

        test('stops delivering to a handler once unsubscribed', () => {
            testInEffectRoot(() => {
                const hub = connectedHub();

                let count = 0;
                const off = hub.on('ping', () => count++);

                FakeWebSocket.last().emit({ type: 'ping', id: 'x' });
                off();
                FakeWebSocket.last().emit({ type: 'ping', id: 'x' });

                expect(count).toBe(1);
                hub.destroy();
            });
        });

        test('ignores frames with no handler, unknown types, and malformed input', () => {
            testInEffectRoot(() => {
                const hub = connectedHub();

                let count = 0;
                hub.on('ping', () => count++);

                FakeWebSocket.last().emit({ type: 'other' }); // no handler
                FakeWebSocket.last().emit({ id: 'x' }); // no type
                FakeWebSocket.last().emitRaw('{not json');
                FakeWebSocket.last().emitRaw('42'); // not an object

                expect(count).toBe(0);
                hub.destroy();
            });
        });

        test('does not route the connected frame to type handlers', () => {
            testInEffectRoot(() => {
                const hub = new BuilderHub({ url: 'ws://test/connect' });
                hub.connect();
                FakeWebSocket.last().open();

                let count = 0;
                hub.on('connected', () => count++);
                FakeWebSocket.last().emit(CONNECTED);

                expect(count).toBe(0);
                hub.destroy();
            });
        });
    });

    describe('connected handshake', () => {
        test('is not connected until the server sends the connected frame', () => {
            testInEffectRoot(() => {
                const hub = new BuilderHub({ url: 'ws://test/connect' });
                hub.connect();
                expect(hub.status).toBe('connecting');

                FakeWebSocket.last().open();
                expect(hub.status).toBe('connecting');
                expect(hub.isConnected).toBe(false);
                expect(hub.userId).toBeNull();

                FakeWebSocket.last().emit(CONNECTED);
                expect(hub.status).toBe('connected');
                expect(hub.isConnected).toBe(true);
                expect(hub.userId).toBe(USER_ID);
                hub.destroy();
            });
        });

        test('notifies onConnected with the user id', () => {
            testInEffectRoot(() => {
                const hub = new BuilderHub({ url: 'ws://test/connect' });
                const seen: string[] = [];
                hub.onConnected((userId) => seen.push(userId));
                hub.connect();
                FakeWebSocket.last().open();
                expect(seen).toEqual([]);

                FakeWebSocket.last().emit(CONNECTED);
                expect(seen).toEqual([USER_ID]);
                hub.destroy();
            });
        });

        test('already reports the user id and connected state inside the onConnected handler', () => {
            testInEffectRoot(() => {
                const hub = new BuilderHub({ url: 'ws://test/connect' });
                const seen: unknown[] = [];
                // A stream adapter subscribes from here, so `send` must already work.
                hub.onConnected(() => seen.push([hub.userId, hub.isConnected, hub.send('x')]));
                hub.connect();
                FakeWebSocket.last().open();
                FakeWebSocket.last().emit(CONNECTED);

                expect(seen).toEqual([[USER_ID, true, true]]);
                expect(FakeWebSocket.last().sent).toEqual(['x']);
                hub.destroy();
            });
        });

        test('ignores connected frames without a valid user id', () => {
            testInEffectRoot(() => {
                const hub = new BuilderHub({ url: 'ws://test/connect' });
                hub.connect();
                FakeWebSocket.last().open();

                FakeWebSocket.last().emit({ type: 'connected' });
                FakeWebSocket.last().emit({ type: 'connected', userId: 7 });
                FakeWebSocket.last().emit({ type: 'connected', userId: '' });

                expect(hub.userId).toBeNull();
                expect(hub.isConnected).toBe(false);
                hub.destroy();
            });
        });

        test('ignores a repeated connected frame on the same connection', () => {
            testInEffectRoot(() => {
                const hub = new BuilderHub({ url: 'ws://test/connect' });
                let count = 0;
                hub.onConnected(() => count++);
                hub.connect();
                FakeWebSocket.last().open();
                FakeWebSocket.last().emit(CONNECTED);
                FakeWebSocket.last().emit({ type: 'connected', userId: 'someone-else' });

                expect(count).toBe(1);
                expect(hub.userId).toBe(USER_ID);
                hub.destroy();
            });
        });

        test('stops notifying an unsubscribed onConnected handler', () => {
            testInEffectRoot(() => {
                const hub = new BuilderHub({ url: 'ws://test/connect' });
                let count = 0;
                const off = hub.onConnected(() => count++);
                off();
                hub.connect();
                FakeWebSocket.last().open();
                FakeWebSocket.last().emit(CONNECTED);

                expect(count).toBe(0);
                hub.destroy();
            });
        });
    });

    describe('sending', () => {
        test('sends encoded frames through the socket once connected', () => {
            testInEffectRoot(() => {
                const hub = connectedHub();

                expect(hub.send('{"type":"ping","id":"x"}')).toBe(true);
                expect(FakeWebSocket.last().sent).toEqual(['{"type":"ping","id":"x"}']);
                hub.destroy();
            });
        });

        test('refuses frames before the connected frame and never queues them', () => {
            testInEffectRoot(() => {
                const hub = new BuilderHub({ url: 'ws://test/connect' });
                hub.connect();
                FakeWebSocket.last().open();

                expect(hub.send('early')).toBe(false);
                FakeWebSocket.last().emit(CONNECTED);

                expect(FakeWebSocket.last().sent).toEqual([]);
                hub.destroy();
            });
        });

        test('does not replay frames sent while disconnected after the reconnect', () => {
            testInEffectRoot(() => {
                const hub = connectedHub();
                FakeWebSocket.last().serverClose(1006);

                expect(hub.send('lost')).toBe(false);
                vi.advanceTimersByTime(20_000);
                FakeWebSocket.last().open();
                FakeWebSocket.last().emit(CONNECTED);

                expect(FakeWebSocket.last().sent).toEqual([]);
                hub.destroy();
            });
        });
    });

    describe('disconnects', () => {
        test('notifies onDisconnected once and forgets the user id', () => {
            testInEffectRoot(() => {
                const hub = connectedHub();
                let count = 0;
                hub.onDisconnected(() => count++);

                FakeWebSocket.last().serverClose(1006);

                expect(count).toBe(1);
                expect(hub.userId).toBeNull();
                expect(hub.isConnected).toBe(false);
                expect(hub.status).toBe('reconnecting');
                hub.destroy();
            });
        });

        test('does not notify onDisconnected when the connection never completed the handshake', () => {
            testInEffectRoot(() => {
                const hub = new BuilderHub({ url: 'ws://test/connect' });
                let count = 0;
                hub.onDisconnected(() => count++);
                hub.connect();
                FakeWebSocket.last().open();

                FakeWebSocket.last().serverClose(1006);

                expect(count).toBe(0);
                hub.destroy();
            });
        });

        test('notifies onConnected again after a reconnect', () => {
            testInEffectRoot(() => {
                const hub = new BuilderHub({ url: 'ws://test/connect' });
                const events: string[] = [];
                hub.onConnected((userId) => events.push(`connected ${userId}`));
                hub.onDisconnected(() => events.push('disconnected'));
                hub.connect();
                FakeWebSocket.last().open();
                FakeWebSocket.last().emit(CONNECTED);

                FakeWebSocket.last().serverClose(1006);
                vi.advanceTimersByTime(20_000);
                FakeWebSocket.last().open();
                FakeWebSocket.last().emit(CONNECTED);

                expect(events).toEqual([`connected ${USER_ID}`, 'disconnected', `connected ${USER_ID}`]);
                expect(hub.status).toBe('connected');
                hub.destroy();
            });
        });

        test.each([
            [4000, 'busy'],
            [4000, 'slow_consumer'],
            [1001, ''],
            [1006, '']
        ])('reconnects after close %i %s', (code, reason) => {
            testInEffectRoot(() => {
                const hub = connectedHub();
                const sockets = FakeWebSocket.instances.length;

                FakeWebSocket.last().serverClose(code, reason);
                vi.advanceTimersByTime(20_000);

                expect(FakeWebSocket.instances.length).toBe(sockets + 1);
                expect(hub.replaced).toBe(false);
                hub.destroy();
            });
        });

        test('does not reconnect once another connection replaced this one', () => {
            testInEffectRoot(() => {
                const hub = connectedHub();
                const sockets = FakeWebSocket.instances.length;

                FakeWebSocket.last().serverClose(4000, 'replaced');
                vi.advanceTimersByTime(60_000);

                expect(FakeWebSocket.instances.length).toBe(sockets);
                expect(hub.replaced).toBe(true);
                expect(hub.status).toBe('closed');
                expect(hub.userId).toBeNull();
                hub.destroy();
            });
        });

        test('notifies onDisconnected when replaced', () => {
            testInEffectRoot(() => {
                const hub = connectedHub();
                let count = 0;
                hub.onDisconnected(() => count++);

                FakeWebSocket.last().serverClose(4000, 'replaced');

                expect(count).toBe(1);
                hub.destroy();
            });
        });

        test('clears the replaced flag when reopened with connect', () => {
            testInEffectRoot(() => {
                const hub = connectedHub();
                FakeWebSocket.last().serverClose(4000, 'replaced');

                hub.connect();
                FakeWebSocket.last().open();
                FakeWebSocket.last().emit(CONNECTED);

                expect(hub.replaced).toBe(false);
                expect(hub.isConnected).toBe(true);
                hub.destroy();
            });
        });

        test('close() notifies onDisconnected and stops reconnecting', () => {
            testInEffectRoot(() => {
                const hub = connectedHub();
                let count = 0;
                hub.onDisconnected(() => count++);
                const sockets = FakeWebSocket.instances.length;

                hub.close();
                vi.advanceTimersByTime(60_000);

                expect(count).toBe(1);
                expect(hub.userId).toBeNull();
                expect(FakeWebSocket.instances.length).toBe(sockets);
                hub.destroy();
            });
        });
    });
});
