import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, test } from 'vitest';
import ChatMessageList, { type ChatListItem } from './ChatMessageList.svelte';

afterEach(() => {
    cleanup();
});

const items: ChatListItem[] = [
    { id: '1-0', text: 'first', own: false, author: 'a' },
    { id: '2-0', text: 'second', own: true, author: 'You' }
];

describe('ChatMessageList', () => {
    test('renders one bubble per message', () => {
        const { container } = render(ChatMessageList, { props: { messages: items } });
        expect(container.querySelectorAll('[data-slot="chat-bubble"]')).toHaveLength(2);
        expect(screen.getByText('first')).toBeInTheDocument();
        expect(screen.getByText('second')).toBeInTheDocument();
    });

    test('renders nothing bubble-wise when empty', () => {
        const { container } = render(ChatMessageList, { props: { messages: [] } });
        expect(container.querySelectorAll('[data-slot="chat-bubble"]')).toHaveLength(0);
    });

    test('inserts a skip marker where the sequence has a gap', () => {
        const gapped: ChatListItem[] = [
            { id: '5-0', text: 'a', own: false },
            { id: '5-1', text: 'b', own: false },
            { id: '5-4', text: 'c', own: false } // seq jumps 1 -> 4
        ];
        const { container } = render(ChatMessageList, { props: { messages: gapped } });
        const skips = container.querySelectorAll('[data-slot="chat-skip"]');
        expect(skips).toHaveLength(1);
        expect(skips[0]).toHaveTextContent('[...]');
    });

    test('no skip marker for a contiguous sequence', () => {
        const contiguous: ChatListItem[] = [
            { id: '5-0', text: 'a', own: false },
            { id: '5-1', text: 'b', own: false },
            { id: '5-2', text: 'c', own: false }
        ];
        const { container } = render(ChatMessageList, { props: { messages: contiguous } });
        expect(container.querySelectorAll('[data-slot="chat-skip"]')).toHaveLength(0);
    });
});
