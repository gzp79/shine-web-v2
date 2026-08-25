import { testInEffectRoot } from '@testing';
import { flushSync } from 'svelte';
import { describe, expect, test } from 'vitest';
import type { BuilderHub, FrameHandler, ServerFrame } from '../hub';
import type { ChatComment } from './chatProtocol';
import { ChatStream, type ChatStreamOptions } from './chatStream.svelte';

/**
 * Minimal controllable fake hub. The stream only depends on `on`/`send`, so a real socket is
 * unnecessary here — transport behaviour is covered by the hub and websocket suites.
 */
class FakeHub {
    handler: FrameHandler | undefined;
    sent: string[] = [];

    on(_type: string, handler: FrameHandler): () => void {
        this.handler = handler;
        return () => {
            if (this.handler === handler) this.handler = undefined;
        };
    }

    send(frame: string): void {
        this.sent.push(frame);
    }

    emitBatch(messages: ChatComment[]): void {
        this.handler?.({ type: 'chat', messages } satisfies ServerFrame);
    }
}

function makeStream(hub: FakeHub, options?: ChatStreamOptions): ChatStream {
    return new ChatStream(hub as unknown as BuilderHub, options);
}

describe('ChatStream', () => {
    test('encodes sent text as a chat request', () => {
        testInEffectRoot(() => {
            const hub = new FakeHub();
            const chat = makeStream(hub);

            chat.send('  hello  ');
            expect(hub.sent).toEqual(['{"type":"chat","text":"hello"}']);
        });
    });

    test('ignores empty/whitespace-only sends', () => {
        testInEffectRoot(() => {
            const hub = new FakeHub();
            const chat = makeStream(hub);

            chat.send('   ');
            expect(hub.sent).toEqual([]);
        });
    });

    test('folds incoming batches into the reactive message list', () => {
        testInEffectRoot(() => {
            const hub = new FakeHub();
            const chat = makeStream(hub);

            hub.emitBatch([
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
            const hub = new FakeHub();
            const chat = makeStream(hub);

            hub.emitBatch([{ id: '1-0', from: 'a', text: 'first' }]);
            hub.emitBatch([
                { id: '1-0', from: 'a', text: 'first' }, // duplicate
                { id: '2-0', from: 'b', text: 'second' }
            ]);
            flushSync();

            expect(chat.messages.map((m) => m.id)).toEqual(['1-0', '2-0']);
        });
    });

    test('orders messages chronologically by stream id', () => {
        testInEffectRoot(() => {
            const hub = new FakeHub();
            const chat = makeStream(hub);

            // Arrive out of order.
            hub.emitBatch([
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
            const hub = new FakeHub();
            const chat = makeStream(hub, { maxMessages: 2 });

            hub.emitBatch([
                { id: '1-0', from: 'a', text: 'one' },
                { id: '2-0', from: 'a', text: 'two' },
                { id: '3-0', from: 'a', text: 'three' }
            ]);
            flushSync();

            expect(chat.messages.map((m) => m.text)).toEqual(['two', 'three']);
        });
    });

    test('tracks unread messages and clears them on markAllRead', () => {
        testInEffectRoot(() => {
            const hub = new FakeHub();
            const chat = makeStream(hub);

            expect(chat.hasUnread).toBe(false);
            expect(chat.unreadCount).toBe(0);

            hub.emitBatch([
                { id: '1-0', from: 'a', text: 'first' },
                { id: '2-0', from: 'b', text: 'second' }
            ]);
            flushSync();

            expect(chat.unreadCount).toBe(2);
            expect(chat.hasUnread).toBe(true);

            chat.markAllRead();
            expect(chat.unreadCount).toBe(0);
            expect(chat.hasUnread).toBe(false);

            hub.emitBatch([{ id: '3-0', from: 'a', text: 'third' }]);
            flushSync();

            expect(chat.unreadCount).toBe(1);
            expect(chat.hasUnread).toBe(true);

            // Re-marking read after already-read messages arrive again keeps count at zero.
            chat.markAllRead();
            hub.emitBatch([{ id: '1-0', from: 'a', text: 'first' }]);
            flushSync();

            expect(chat.unreadCount).toBe(0);
        });
    });

    test('stops folding frames once disposed', () => {
        testInEffectRoot(() => {
            const hub = new FakeHub();
            const chat = makeStream(hub);

            hub.emitBatch([{ id: '1-0', from: 'a', text: 'first' }]);
            flushSync();
            expect(chat.messages).toHaveLength(1);

            chat.dispose();
            expect(hub.handler).toBeUndefined();

            hub.handler?.({ type: 'chat', messages: [{ id: '2-0', from: 'b', text: 'after' }] });
            flushSync();
            expect(chat.messages).toHaveLength(1);
        });
    });
});
