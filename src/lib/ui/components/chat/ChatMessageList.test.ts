import { cleanup, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, test } from 'vitest';
import { LOCALE_CONTEXT_KEY, type LocaleContext, createTranslator } from '@lib/i18n';
import en from '@lib/i18n/locales/en.json';
import ChatMessageList from './ChatMessageList.svelte';
import type { ChatMessage } from './chatMessages';

afterEach(() => {
    cleanup();
});

const locale: LocaleContext = { current: 'en', t: createTranslator({ ...en, locale: 'en' }) };
const context = new Map<symbol, unknown>([[LOCALE_CONTEXT_KEY, locale]]);

const user = createRawSnippet<[string]>((id) => ({ render: () => `<span>${id()}</span>` }));

const messages: ChatMessage[] = [
    { kind: 'text', id: '1-0', from: 'a', text: 'first' },
    { kind: 'text', id: '2-0', from: 'me', text: 'second' }
];

describe('ChatMessageList', () => {
    test('renders one bubble per text message', () => {
        const { container } = render(ChatMessageList, { props: { messages, selfId: 'me', user }, context });
        expect(container.querySelectorAll('[data-slot="chat-bubble"]')).toHaveLength(2);
        expect(screen.getByText('first')).toBeInTheDocument();
        expect(screen.getByText('second')).toBeInTheDocument();
    });

    test('renders the localized empty state and no bubbles when empty', () => {
        const { container } = render(ChatMessageList, { props: { messages: [], selfId: 'me', user }, context });
        expect(container.querySelectorAll('[data-slot="chat-bubble"]')).toHaveLength(0);
        expect(screen.getByText(en.chat.noMessages)).toBeInTheDocument();
    });

    test('renders a gap entry as a centered note', () => {
        const gapped: ChatMessage[] = [
            { kind: 'text', id: '5-0', from: 'a', text: 'a' },
            { kind: 'gap', id: '5-1' },
            { kind: 'text', id: '5-4', from: 'a', text: 'c' }
        ];
        const { container } = render(ChatMessageList, { props: { messages: gapped, selfId: 'me', user }, context });
        const notes = container.querySelectorAll('[data-slot="chat-note"]');
        expect(notes).toHaveLength(1);
        expect(notes[0]).toHaveTextContent('…');
    });
});
