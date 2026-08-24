import { describe, expect, test } from 'vitest';
import { encodeChatRequest, parseServerMessage } from './protocol';

describe('encodeChatRequest', () => {
    test('encodes a chat request frame', () => {
        expect(encodeChatRequest('hello')).toBe('{"type":"chat","text":"hello"}');
    });
});

describe('parseServerMessage', () => {
    test('parses a chat batch', () => {
        const raw = JSON.stringify({
            type: 'chat',
            messages: [{ id: '1712345678901-0', from: 'user-a', text: 'hi' }]
        });

        const result = parseServerMessage(raw);

        expect(result).toEqual({
            type: 'chat',
            messages: [{ id: '1712345678901-0', from: 'user-a', text: 'hi' }]
        });
    });

    test('drops malformed comments in an otherwise valid batch', () => {
        const raw = JSON.stringify({
            type: 'chat',
            messages: [
                { id: '1-0', from: 'user-a', text: 'ok' },
                { id: 'not-a-stream-id', from: 'user-b', text: 'bad' },
                { id: '2-0', from: 'user-c' } // missing text
            ]
        });

        const result = parseServerMessage(raw);

        expect(result?.messages).toEqual([{ id: '1-0', from: 'user-a', text: 'ok' }]);
    });

    test('returns null for invalid JSON', () => {
        expect(parseServerMessage('{not json')).toBeNull();
    });

    test('returns null for unknown message types', () => {
        expect(parseServerMessage(JSON.stringify({ type: 'ping' }))).toBeNull();
    });

    test('returns null when messages is not an array', () => {
        expect(parseServerMessage(JSON.stringify({ type: 'chat', messages: 'nope' }))).toBeNull();
    });
});
