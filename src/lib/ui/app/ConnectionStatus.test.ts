import { cleanup, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { LOCALE_CONTEXT_KEY, type LocaleContext, createTranslator } from '#lib/i18n';
import en from '#lib/i18n/locales/en.json';
import type { ConnectionStatusContext } from './ConnectionStatus.svelte';
import ConnectionStatusHarness from './ConnectionStatusHarness.svelte';

afterEach(() => {
    cleanup();
});

const locale: LocaleContext = { current: 'en', t: createTranslator({ ...en, locale: 'en' }) };
const context = new Map<symbol, unknown>([[LOCALE_CONTEXT_KEY, locale]]);

function renderIndicator(): { status: ConnectionStatusContext; container: HTMLElement } {
    let status: ConnectionStatusContext | undefined;
    const { container } = render(ConnectionStatusHarness, {
        props: { onContext: (provided: ConnectionStatusContext) => (status = provided) },
        context
    });
    if (!status) throw new Error('the harness did not provide the context');
    return { status, container };
}

const unreadDot = (container: HTMLElement) => container.querySelector('span.rounded-full');

describe('ConnectionStatus', () => {
    test('renders nothing until a region publishes its status', () => {
        renderIndicator();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    test('opens the chat on click', () => {
        const { status } = renderIndicator();
        const onClick = vi.fn();
        status.set({ status: 'connected', hasUnread: false, onClick });
        flushSync();

        screen.getByRole('button', { name: en.chat.chat }).click();

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('shows the unread marker only while there are unread messages', () => {
        const { status, container } = renderIndicator();
        let hasUnread = false;
        status.set({
            status: 'connected',
            get hasUnread() {
                return hasUnread;
            },
            onClick: () => {}
        });
        flushSync();
        expect(unreadDot(container)).toBeNull();

        hasUnread = true;
        status.set({ status: 'connected', hasUnread, onClick: () => {} });
        flushSync();
        expect(unreadDot(container)).not.toBeNull();
    });

    test('goes away when the region withdraws its status', () => {
        const { status } = renderIndicator();
        status.set({ status: 'connected', hasUnread: true, onClick: () => {} });
        flushSync();

        expect(() => {
            status.set(undefined);
            flushSync();
        }).not.toThrow();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});
