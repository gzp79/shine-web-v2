import { cleanup, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, test } from 'vitest';
import ChatMessageList from './ChatMessageList.svelte';
import type { ChatMessage } from './chatMessages';

afterEach(() => {
    cleanup();
});

const user = createRawSnippet<[string]>((id) => ({ render: () => `<span>${id()}</span>` }));

const messages: ChatMessage[] = [
    { kind: 'text', id: '1-0', from: 'a', text: 'first' },
    { kind: 'text', id: '2-0', from: 'me', text: 'second' }
];

describe('ChatMessageList', () => {
    test('renders one bubble per text message', () => {
        const { container } = render(ChatMessageList, { props: { messages, selfId: 'me', user } });
        expect(container.querySelectorAll('[data-slot="chat-bubble"]')).toHaveLength(2);
        expect(screen.getByText('first')).toBeInTheDocument();
        expect(screen.getByText('second')).toBeInTheDocument();
    });

    test('renders nothing bubble-wise when empty', () => {
        const { container } = render(ChatMessageList, { props: { messages: [], selfId: 'me', user } });
        expect(container.querySelectorAll('[data-slot="chat-bubble"]')).toHaveLength(0);
    });

    test('renders a gap entry as a centered note', () => {
        const gapped: ChatMessage[] = [
            { kind: 'text', id: '5-0', from: 'a', text: 'a' },
            { kind: 'gap', id: '5-1' },
            { kind: 'text', id: '5-4', from: 'a', text: 'c' }
        ];
        const { container } = render(ChatMessageList, { props: { messages: gapped, selfId: 'me', user } });
        const notes = container.querySelectorAll('[data-slot="chat-note"]');
        expect(notes).toHaveLength(1);
        expect(notes[0]).toHaveTextContent('…');
    });
});
