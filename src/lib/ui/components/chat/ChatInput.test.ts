import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import ChatInput from './ChatInput.svelte';

afterEach(() => {
    cleanup();
});

describe('ChatInput', () => {
    test('submits the trimmed text on Enter and clears the input', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(ChatInput, { props: { onSubmit } });
        const input = screen.getByRole('textbox');

        await user.type(input, '  hello  {Enter}');

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith('hello');
        expect(input).toHaveValue('');
    });

    test('submits when the send button is clicked', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(ChatInput, { props: { onSubmit } });

        await user.type(screen.getByRole('textbox'), 'via button');
        await user.click(screen.getByRole('button'));

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith('via button');
    });

    test('does not submit empty input', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(ChatInput, { props: { onSubmit } });
        await user.type(screen.getByRole('textbox'), '   {Enter}');

        expect(onSubmit).not.toHaveBeenCalled();
    });

    test('does not submit on Shift+Enter (reserved for newline)', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(ChatInput, { props: { onSubmit } });
        const input = screen.getByRole('textbox');
        await user.type(input, 'line{Shift>}{Enter}{/Shift}');

        expect(onSubmit).not.toHaveBeenCalled();
    });

    test('disables the send button when empty', () => {
        render(ChatInput, { props: { onSubmit: vi.fn() } });
        expect(screen.getByRole('button')).toBeDisabled();
    });
});
