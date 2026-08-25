import { config } from '@config';
import { testInEffectRoot } from '@testing';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { BuilderHub, builderHubUrl } from './hub';

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
        FakeWebSocket.instances = [];
        vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    test('routes frames to the handler registered for their type', () => {
        testInEffectRoot(() => {
            const hub = new BuilderHub({ url: 'ws://test/connect' });
            hub.connect();
            FakeWebSocket.last().open();

            const chat: unknown[] = [];
            const ping: unknown[] = [];
            hub.on('chat', (frame) => chat.push(frame));
            hub.on('ping', (frame) => ping.push(frame));

            FakeWebSocket.last().emit({ type: 'chat', messages: [] });
            FakeWebSocket.last().emit({ type: 'ping', at: 1 });

            expect(chat).toEqual([{ type: 'chat', messages: [] }]);
            expect(ping).toEqual([{ type: 'ping', at: 1 }]);
        });
    });

    test('fans a frame out to every handler of its type', () => {
        testInEffectRoot(() => {
            const hub = new BuilderHub({ url: 'ws://test/connect' });
            hub.connect();
            FakeWebSocket.last().open();

            let a = 0;
            let b = 0;
            hub.on('chat', () => a++);
            hub.on('chat', () => b++);

            FakeWebSocket.last().emit({ type: 'chat', messages: [] });
            expect([a, b]).toEqual([1, 1]);
        });
    });

    test('stops delivering to a handler once unsubscribed', () => {
        testInEffectRoot(() => {
            const hub = new BuilderHub({ url: 'ws://test/connect' });
            hub.connect();
            FakeWebSocket.last().open();

            let count = 0;
            const off = hub.on('chat', () => count++);

            FakeWebSocket.last().emit({ type: 'chat', messages: [] });
            off();
            FakeWebSocket.last().emit({ type: 'chat', messages: [] });

            expect(count).toBe(1);
        });
    });

    test('ignores frames with no handler, unknown types, and malformed input', () => {
        testInEffectRoot(() => {
            const hub = new BuilderHub({ url: 'ws://test/connect' });
            hub.connect();
            FakeWebSocket.last().open();

            let count = 0;
            hub.on('chat', () => count++);

            FakeWebSocket.last().emit({ type: 'other' }); // no handler
            FakeWebSocket.last().emit({ messages: [] }); // no type
            FakeWebSocket.last().emitRaw('{not json');
            FakeWebSocket.last().emitRaw('42'); // not an object

            expect(count).toBe(0);
        });
    });

    test('sends encoded frames through the socket', () => {
        testInEffectRoot(() => {
            const hub = new BuilderHub({ url: 'ws://test/connect' });
            hub.connect();
            FakeWebSocket.last().open();

            hub.send('{"type":"chat","text":"hi"}');
            expect(FakeWebSocket.last().sent).toEqual(['{"type":"chat","text":"hi"}']);
        });
    });
});
