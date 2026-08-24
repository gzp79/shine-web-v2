import { config } from '@config';
import { testInEffectRoot } from '@testing';
import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { BuilderChatConnection, builderChatUrl } from './chatConnection.svelte';
import type { ChatComment } from './protocol';

// Minimal controllable fake WebSocket (see _websocket.svelte.test.ts for the full rationale).
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
    emitBatch(messages: ChatComment[]): void {
        this.onmessage?.({ data: JSON.stringify({ type: 'chat', messages }) });
    }
}

describe('builderChatUrl', () => {
    test('derives the ws connect endpoint from the configured builder ws url', () => {
        // Environment-independent: the http(s) base becomes a ws(s) url ending in the connect path.
        const url = builderChatUrl();
        const wsScheme = config.builderWSUrl.startsWith('https') ? 'wss://' : 'ws://';
        expect(url.startsWith(wsScheme)).toBe(true);
        expect(url.endsWith('/api/connect')).toBe(true);
        expect(url).not.toContain('//api/connect');
    });
});

describe('BuilderChatConnection', () => {
    beforeEach(() => {
        FakeWebSocket.instances = [];
        vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    test('encodes sent text as a chat request', () => {
        testInEffectRoot(() => {
            const chat = new BuilderChatConnection({ url: 'ws://test/connect' });
            chat.connect();
            FakeWebSocket.last().open();

            chat.send('  hello  ');
            expect(FakeWebSocket.last().sent).toEqual(['{"type":"chat","text":"hello"}']);
        });
    });

    test('ignores empty/whitespace-only sends', () => {
        testInEffectRoot(() => {
            const chat = new BuilderChatConnection({ url: 'ws://test/connect' });
            chat.connect();
            FakeWebSocket.last().open();

            chat.send('   ');
            expect(FakeWebSocket.last().sent).toEqual([]);
        });
    });

    test('folds incoming batches into the reactive message list', () => {
        testInEffectRoot(() => {
            const chat = new BuilderChatConnection({ url: 'ws://test/connect' });
            chat.connect();
            FakeWebSocket.last().open();

            FakeWebSocket.last().emitBatch([
                { id: '1-0', from: 'a', text: 'first' },
                { id: '2-0', from: 'b', text: 'second' }
            ]);
            flushSync();

            expect(chat.messages).toEqual([
                { id: '1-0', from: 'a', text: 'first' },
                { id: '2-0', from: 'b', text: 'second' }
            ]);
        });
    });

    test('deduplicates messages by stream id across batches (at-least-once delivery)', () => {
        testInEffectRoot(() => {
            const chat = new BuilderChatConnection({ url: 'ws://test/connect' });
            chat.connect();
            FakeWebSocket.last().open();

            FakeWebSocket.last().emitBatch([{ id: '1-0', from: 'a', text: 'first' }]);
            FakeWebSocket.last().emitBatch([
                { id: '1-0', from: 'a', text: 'first' }, // duplicate
                { id: '2-0', from: 'b', text: 'second' }
            ]);
            flushSync();

            expect(chat.messages.map((m) => m.id)).toEqual(['1-0', '2-0']);
        });
    });

    test('orders messages chronologically by stream id', () => {
        testInEffectRoot(() => {
            const chat = new BuilderChatConnection({ url: 'ws://test/connect' });
            chat.connect();
            FakeWebSocket.last().open();

            // Arrive out of order.
            FakeWebSocket.last().emitBatch([
                { id: '10-0', from: 'a', text: 'later' },
                { id: '2-5', from: 'b', text: 'middle' },
                { id: '2-1', from: 'c', text: 'early' }
            ]);
            flushSync();

            expect(chat.messages.map((m) => m.text)).toEqual(['early', 'middle', 'later']);
        });
    });

    test('trims to the retention cap, dropping the oldest', () => {
        testInEffectRoot(() => {
            const chat = new BuilderChatConnection({ url: 'ws://test/connect', maxMessages: 2 });
            chat.connect();
            FakeWebSocket.last().open();

            FakeWebSocket.last().emitBatch([
                { id: '1-0', from: 'a', text: 'one' },
                { id: '2-0', from: 'a', text: 'two' },
                { id: '3-0', from: 'a', text: 'three' }
            ]);
            flushSync();

            expect(chat.messages.map((m) => m.text)).toEqual(['two', 'three']);
        });
    });
});
