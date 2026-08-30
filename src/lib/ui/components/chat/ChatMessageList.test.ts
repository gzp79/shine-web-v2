import { cleanup, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, test } from 'vitest';
import { LOCALE_CONTEXT_KEY, type LocaleContext, createTranslator } from '@lib/i18n';
import en from '@lib/i18n/locales/en.json';
import ChatMessageList, { type ChatMessageLike } from './ChatMessageList.svelte';

afterEach(() => {
    cleanup();
});

const locale: LocaleContext = { current: 'en', t: createTranslator({ ...en, locale: 'en' }) };
const context = new Map<symbol, unknown>([[LOCALE_CONTEXT_KEY, locale]]);

type SampleMessage = ChatMessageLike & { kind: 'text' | 'gap'; text?: string };

const item = createRawSnippet<[ChatMessageLike]>((message) => ({
    render: () => {
        const m = message() as SampleMessage;
        return m.kind === 'gap'
            ? '<div data-slot="chat-note">…</div>'
            : `<div data-slot="chat-bubble">${m.text ?? ''}</div>`;
    }
}));

const messages: SampleMessage[] = [
    { kind: 'text', id: '1-0', text: 'first' },
    { kind: 'text', id: '2-0', text: 'second' }
];

describe('ChatMessageList', () => {
    test('renders the item snippet once per message', () => {
        const { container } = render(ChatMessageList, { props: { messages, item }, context });
        expect(container.querySelectorAll('[data-slot="chat-bubble"]')).toHaveLength(2);
        expect(screen.getByText('first')).toBeInTheDocument();
        expect(screen.getByText('second')).toBeInTheDocument();
    });

    test('renders the localized empty state and no items when empty', () => {
        const { container } = render(ChatMessageList, { props: { messages: [], item }, context });
        expect(container.querySelectorAll('[data-slot="chat-bubble"]')).toHaveLength(0);
        expect(screen.getByText(en.chat.noMessages)).toBeInTheDocument();
    });

    test('renders a gap entry through the item snippet', () => {
        const gapped: SampleMessage[] = [
            { kind: 'text', id: '5-0', text: 'a' },
            { kind: 'gap', id: '5-1' },
            { kind: 'text', id: '5-4', text: 'c' }
        ];
        const { container } = render(ChatMessageList, { props: { messages: gapped, item }, context });
        const notes = container.querySelectorAll('[data-slot="chat-note"]');
        expect(notes).toHaveLength(1);
        expect(notes[0]).toHaveTextContent('…');
    });
});
