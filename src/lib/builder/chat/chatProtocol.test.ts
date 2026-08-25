import { describe, expect, test } from 'vitest';
import type { ServerFrame } from '../hub';
import { encodeChatRequest, parseChatComments } from './chatProtocol';

describe('encodeChatRequest', () => {
    test('encodes a chat request frame', () => {
        expect(encodeChatRequest('hello')).toBe('{"type":"chat","text":"hello"}');
    });
});

describe('parseChatComments', () => {
    test('returns the valid comments of a chat frame', () => {
        const frame: ServerFrame = {
            type: 'chat',
            messages: [{ id: '1712345678901-0', from: 'user-a', text: 'hi' }]
        };

        expect(parseChatComments(frame)).toEqual([{ id: '1712345678901-0', from: 'user-a', text: 'hi' }]);
    });

    test('drops malformed comments in an otherwise valid batch', () => {
        const frame: ServerFrame = {
            type: 'chat',
            messages: [
                { id: '1-0', from: 'user-a', text: 'ok' },
                { id: 'not-a-stream-id', from: 'user-b', text: 'bad' },
                { id: '2-0', from: 'user-c' } // missing text
            ]
        };

        expect(parseChatComments(frame)).toEqual([{ id: '1-0', from: 'user-a', text: 'ok' }]);
    });

    test('returns an empty array when messages is missing or not an array', () => {
        expect(parseChatComments({ type: 'chat' })).toEqual([]);
        expect(parseChatComments({ type: 'chat', messages: 'nope' })).toEqual([]);
    });
});
