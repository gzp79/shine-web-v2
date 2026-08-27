import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, test } from 'vitest';
import ChatBubble from './ChatBubble.svelte';

afterEach(() => {
    cleanup();
});

describe('ChatBubble', () => {
    test('renders the message text', () => {
        render(ChatBubble, { props: { text: 'hello world' } });
        expect(screen.getByText('hello world')).toBeInTheDocument();
    });

    test('aligns own messages to the end', () => {
        const { container } = render(ChatBubble, { props: { text: 'mine', align: 'end' } });
        const wrapper = container.querySelector('[data-slot="chat-bubble"]');
        expect(wrapper).toHaveClass('justify-end');
    });

    test('aligns other messages to the start', () => {
        const { container } = render(ChatBubble, { props: { text: 'theirs', align: 'start' } });
        const wrapper = container.querySelector('[data-slot="chat-bubble"]');
        expect(wrapper).toHaveClass('justify-start');
    });

    test('renders a centered note without a bubble', () => {
        const { container } = render(ChatBubble, { props: { text: '…', align: 'center' } });
        expect(container.querySelector('[data-slot="chat-bubble"]')).toBeNull();
        expect(container.querySelector('[data-slot="chat-note"]')).toBeInTheDocument();
    });

    test('renders the author label when provided', () => {
        render(ChatBubble, { props: { text: 'hi', author: 'user-1234' } });
        expect(screen.getByText('user-1234')).toBeInTheDocument();
    });
});
