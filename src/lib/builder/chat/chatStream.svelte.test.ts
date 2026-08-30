import { testInEffectRoot } from '@testing';
import { flushSync } from 'svelte';
import { describe, expect, test } from 'vitest';
import type { BuilderHub, FrameHandler, ServerFrame } from '../hub';
import type { ChatMessage } from './chatMessages';
import type { ChatComment } from './chatProtocol';
import { ChatStream, type ChatStreamOptions } from './chatStream.svelte';

/** Body text of a message, or empty for kinds (gap/ping/pong) that carry none. */
function textOf(message: ChatMessage): string {
    return 'text' in message ? message.text : '';
}

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

    test('sends an encoded @ping command with the resolved self id', () => {
        testInEffectRoot(() => {
            const hub = new FakeHub();
            const chat = makeStream(hub);
            chat.bindSelfId(() => 'me');

            chat.send('@ping');
            expect(hub.sent).toHaveLength(1);
            expect(hub.sent[0]).toContain('@ping me ');
        });
    });

    test('ignores an @ping command carrying extra parameters', () => {
        testInEffectRoot(() => {
            const hub = new FakeHub();
            const chat = makeStream(hub);
            chat.bindSelfId(() => 'me');

            chat.send('@ping now');
            expect(hub.sent).toEqual([]);
        });
    });

    test('ignores @ping when the self id is unresolved', () => {
        testInEffectRoot(() => {
            const hub = new FakeHub();
            const chat = makeStream(hub);

            chat.send('@ping');
            expect(hub.sent).toEqual([]);
        });
    });

    test('sends unrecognized @-prefixed text as an ordinary message', () => {
        testInEffectRoot(() => {
            const hub = new FakeHub();
            const chat = makeStream(hub);
            chat.bindSelfId(() => 'me');

            chat.send('@hello there');
            expect(hub.sent).toEqual(['{"type":"chat","text":"@hello there"}']);
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
                { kind: 'text', id: '1-0', from: 'a', text: 'first' },
                { kind: 'text', id: '2-0', from: 'b', text: 'second' }
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

    test('marks a gap between non-contiguous stream ids', () => {
        testInEffectRoot(() => {
            const hub = new FakeHub();
            const chat = makeStream(hub);

            hub.emitBatch([
                { id: '5-0', from: 'a', text: 'a' },
                { id: '5-3', from: 'a', text: 'b' }
            ]);
            flushSync();

            expect(chat.messages.map((m) => m.kind)).toEqual(['text', 'gap', 'text']);
        });
    });

    test('does not mark a gap for a suppressed peer pong', () => {
        testInEffectRoot(() => {
            const hub = new FakeHub();
            const chat = makeStream(hub);
            chat.bindSelfId(() => 'me');

            hub.emitBatch([
                { id: '5-0', from: 'a', text: 'hi' },
                { id: '5-1', from: 'a', text: '@pong b 1 2' }, // peer<->peer pong, suppressed but consumes an id
                { id: '5-2', from: 'a', text: 'bye' }
            ]);
            flushSync();

            expect(chat.messages.map((m) => m.kind)).toEqual(['text', 'text']);
        });
    });

    test('drops out-of-order deliveries below the high-water mark', () => {
        testInEffectRoot(() => {
            const hub = new FakeHub();
            const chat = makeStream(hub);

            // Delivery is in order; a later frame carrying an older id is a stale straggler.
            hub.emitBatch([{ id: '2-1', from: 'a', text: 'newer' }]);
            hub.emitBatch([{ id: '1-0', from: 'b', text: 'older' }]);
            flushSync();

            expect(chat.messages.map(textOf)).toEqual(['newer']);
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

            expect(chat.messages.map(textOf)).toEqual(['two', 'three']);
        });
    });

    test('drops a gap left at the front by the retention cap', () => {
        testInEffectRoot(() => {
            const hub = new FakeHub();
            const chat = makeStream(hub, { maxMessages: 2 });

            // [text 5-0, gap 5-1, text 5-3] before trimming; the cap drops '5-0', which would
            // otherwise leave the gap as an orphan '…' at the top.
            hub.emitBatch([
                { id: '5-0', from: 'a', text: 'a' },
                { id: '5-3', from: 'a', text: 'b' }
            ]);
            flushSync();

            expect(chat.messages.map((m) => m.kind)).toEqual(['text']);
            expect(chat.messages.map(textOf)).toEqual(['b']);
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

    test('measures our own ping echo and does not reply to it', () => {
        testInEffectRoot(() => {
            const hub = new FakeHub();
            const chat = makeStream(hub);
            chat.bindSelfId(() => 'me');

            hub.emitBatch([{ id: '1-0', from: 'me', text: `@ping me ${Date.now()}` }]);
            flushSync();

            expect(chat.messages).toMatchObject([{ kind: 'ping', from: 'me', selfMs: expect.any(Number) }]);
            expect(hub.sent).toEqual([]);
        });
    });

    test('replies to a peer ping and shows it without a self time', () => {
        testInEffectRoot(() => {
            const hub = new FakeHub();
            const chat = makeStream(hub);
            chat.bindSelfId(() => 'me');

            hub.emitBatch([{ id: '1-0', from: 'other', text: '@ping other 1000' }]);
            flushSync();

            expect(chat.messages).toEqual([{ kind: 'ping', id: '1-0', from: 'other' }]);
            expect(hub.sent).toHaveLength(1);
            expect(hub.sent[0]).toContain('@pong other 1000 ');
        });
    });

    test('measures a peer pong to our ping as the full round-trip', () => {
        testInEffectRoot(() => {
            const hub = new FakeHub();
            const chat = makeStream(hub);
            chat.bindSelfId(() => 'me');

            // id === our user id => this pong answers a ping we sent.
            hub.emitBatch([{ id: '1-0', from: 'other', text: `@pong me ${Date.now()} 5000` }]);
            flushSync();

            expect(chat.messages).toMatchObject([{ kind: 'pong', from: 'other', roundTripMs: expect.any(Number) }]);
        });
    });

    test('drops pongs exchanged between other users', () => {
        testInEffectRoot(() => {
            const hub = new FakeHub();
            const chat = makeStream(hub);
            chat.bindSelfId(() => 'me');

            hub.emitBatch([{ id: '1-0', from: 'a', text: '@pong b 1000 2000' }]);
            flushSync();

            expect(chat.messages).toEqual([]);
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

    test('floods the requested number of plain messages for an @burst command', () => {
        testInEffectRoot(() => {
            const hub = new FakeHub();
            const chat = makeStream(hub);

            chat.send('@burst 3');
            expect(hub.sent).toEqual([
                '{"type":"chat","text":"burst 1/3"}',
                '{"type":"chat","text":"burst 2/3"}',
                '{"type":"chat","text":"burst 3/3"}'
            ]);
        });
    });

    test('ignores an @burst command with a missing, non-numeric, or out-of-range count', () => {
        testInEffectRoot(() => {
            const hub = new FakeHub();
            const chat = makeStream(hub);

            chat.send('@burst');
            chat.send('@burst abc');
            chat.send('@burst 0');
            chat.send('@burst 201');
            expect(hub.sent).toEqual([]);
        });
    });

    test('sends a single trigger frame for an @storm command', () => {
        testInEffectRoot(() => {
            const hub = new FakeHub();
            const chat = makeStream(hub);

            chat.send('@storm 2');
            expect(hub.sent).toEqual(['{"type":"chat","text":"@storm 2"}']);
        });
    });

    test('ignores an @storm command with an invalid count', () => {
        testInEffectRoot(() => {
            const hub = new FakeHub();
            const chat = makeStream(hub);

            chat.send('@storm 201');
            expect(hub.sent).toEqual([]);
        });
    });

    test('answers a received @storm trigger with plain messages and shows the trigger', () => {
        testInEffectRoot(() => {
            const hub = new FakeHub();
            const chat = makeStream(hub);

            hub.emitBatch([{ id: '1-0', from: 'other', text: '@storm 2' }]);
            flushSync();

            expect(hub.sent).toEqual(['{"type":"chat","text":"storm 1/2"}', '{"type":"chat","text":"storm 2/2"}']);
            expect(chat.messages).toEqual([{ kind: 'text', id: '1-0', from: 'other', text: '@storm 2' }]);
        });
    });

    test('does not re-trigger a storm from its own plain replies', () => {
        testInEffectRoot(() => {
            const hub = new FakeHub();
            const chat = makeStream(hub);

            hub.emitBatch([{ id: '1-0', from: 'other', text: 'storm 1/2' }]);
            flushSync();

            expect(hub.sent).toEqual([]);
            expect(chat.messages).toEqual([{ kind: 'text', id: '1-0', from: 'other', text: 'storm 1/2' }]);
        });
    });
});
