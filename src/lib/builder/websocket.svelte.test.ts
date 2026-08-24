import { testInEffectRoot } from '@testing';
import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ResilientWebSocket } from './websocket.svelte';

// A controllable fake WebSocket. Instances register themselves so tests can drive
// open/message/close deterministically.
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
    static reset(): void {
        FakeWebSocket.instances = [];
    }

    readyState = FakeWebSocket.CONNECTING;
    sent: string[] = [];

    onopen: (() => void) | null = null;
    onmessage: ((event: { data: unknown }) => void) | null = null;
    onerror: ((event: unknown) => void) | null = null;
    onclose: ((event: { code: number; reason: string }) => void) | null = null;

    constructor(
        readonly url: string,
        readonly protocols?: string | string[]
    ) {
        FakeWebSocket.instances.push(this);
    }

    send(data: string): void {
        this.sent.push(data);
    }

    close(code = 1000, reason = ''): void {
        if (this.readyState === FakeWebSocket.CLOSED) return;
        this.readyState = FakeWebSocket.CLOSED;
        this.onclose?.({ code, reason });
    }

    // --- test drivers ---
    open(): void {
        this.readyState = FakeWebSocket.OPEN;
        this.onopen?.();
    }
    emit(data: string): void {
        this.onmessage?.({ data });
    }
    serverClose(code = 1006, reason = 'abnormal'): void {
        this.readyState = FakeWebSocket.CLOSED;
        this.onclose?.({ code, reason });
    }
}

describe('ResilientWebSocket', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        FakeWebSocket.reset();
        vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    test('connects and reports connected status', () => {
        testInEffectRoot(() => {
            const socket = new ResilientWebSocket({ url: 'ws://test/connect' });
            socket.connect();
            expect(socket.status).toBe('connecting');

            FakeWebSocket.last().open();
            flushSync();
            expect(socket.status).toBe('connected');
            expect(socket.isConnected).toBe(true);
        });
    });

    test('delivers text frames to onMessage', () => {
        const onMessage = vi.fn();
        testInEffectRoot(() => {
            const socket = new ResilientWebSocket({ url: 'ws://test/connect', onMessage });
            socket.connect();
            FakeWebSocket.last().open();
            FakeWebSocket.last().emit('hello');
        });

        expect(onMessage).toHaveBeenCalledWith('hello');
    });

    test('sends immediately when connected', () => {
        testInEffectRoot(() => {
            const socket = new ResilientWebSocket({ url: 'ws://test/connect' });
            socket.connect();
            FakeWebSocket.last().open();

            expect(socket.send('a')).toBe(true);
            expect(FakeWebSocket.last().sent).toEqual(['a']);
        });
    });

    test('queues messages while disconnected and flushes on connect', () => {
        testInEffectRoot(() => {
            const socket = new ResilientWebSocket({ url: 'ws://test/connect' });
            socket.connect();

            // Not open yet — buffered.
            expect(socket.send('a')).toBe(false);
            expect(socket.send('b')).toBe(false);
            expect(socket.pending).toBe(2);

            FakeWebSocket.last().open();
            flushSync();

            expect(FakeWebSocket.last().sent).toEqual(['a', 'b']);
            expect(socket.pending).toBe(0);
        });
    });

    test('reconnects with backoff after an unexpected close', () => {
        testInEffectRoot(() => {
            const socket = new ResilientWebSocket({ url: 'ws://test/connect', baseReconnectDelay: 100 });
            socket.connect();
            FakeWebSocket.last().open();
            flushSync();
            expect(socket.status).toBe('connected');

            FakeWebSocket.last().serverClose();
            flushSync();
            expect(socket.status).toBe('reconnecting');

            const before = FakeWebSocket.instances.length;
            // Advance past the first backoff (100ms + up to 20% jitter).
            vi.advanceTimersByTime(200);
            expect(FakeWebSocket.instances.length).toBe(before + 1);

            FakeWebSocket.last().open();
            flushSync();
            expect(socket.status).toBe('connected');
            expect(socket.reconnectAttempts).toBe(0);
        });
    });

    test('does not reconnect after an explicit close', () => {
        testInEffectRoot(() => {
            const socket = new ResilientWebSocket({ url: 'ws://test/connect' });
            socket.connect();
            FakeWebSocket.last().open();
            flushSync();

            const count = FakeWebSocket.instances.length;
            socket.close();
            flushSync();
            expect(socket.status).toBe('closed');

            vi.advanceTimersByTime(10000);
            expect(FakeWebSocket.instances.length).toBe(count);
        });
    });

    test('gives up after maxReconnectAttempts and calls onGiveUp', () => {
        const onGiveUp = vi.fn();
        testInEffectRoot(() => {
            const socket = new ResilientWebSocket({
                url: 'ws://test/connect',
                baseReconnectDelay: 10,
                maxReconnectDelay: 10,
                maxReconnectAttempts: 2,
                onGiveUp
            });
            socket.connect();
            FakeWebSocket.last().open();
            flushSync();

            // Each new socket immediately fails to connect.
            for (let i = 0; i < 3; i++) {
                FakeWebSocket.last().serverClose();
                flushSync();
                vi.advanceTimersByTime(50);
            }

            expect(socket.status).toBe('closed');
            expect(onGiveUp).toHaveBeenCalledTimes(1);
        });
    });

    test('recovers immediately when connectivity is restored', () => {
        testInEffectRoot(() => {
            const socket = new ResilientWebSocket({ url: 'ws://test/connect', baseReconnectDelay: 60_000 });
            socket.connect();
            FakeWebSocket.last().open();
            flushSync();

            FakeWebSocket.last().serverClose();
            flushSync();
            expect(socket.status).toBe('reconnecting');

            const before = FakeWebSocket.instances.length;
            // The backoff is 60s, but an 'online' event should reconnect right away.
            window.dispatchEvent(new Event('online'));
            flushSync();

            expect(FakeWebSocket.instances.length).toBe(before + 1);
        });
    });
});
