import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test } from 'vitest';
import Button from './Button.svelte';

afterEach(() => {
    cleanup();
});

describe('Button', () => {
    test('renders as button element', () => {
        render(Button);

        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
    });

    test('calls onclick handler when clicked', async () => {
        const user = userEvent.setup();
        let clicked = false;

        render(Button, {
            props: {
                onclick: () => {
                    clicked = true;
                }
            }
        });

        const button = screen.getByRole('button');
        await user.click(button);

        expect(clicked).toBe(true);
    });

    test('renders as disabled', () => {
        render(Button, {
            props: {
                disabled: true
            }
        });

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });

    test('does not call onclick when disabled', async () => {
        const user = userEvent.setup();
        let clicked = false;

        render(Button, {
            props: {
                disabled: true,
                onclick: () => {
                    clicked = true;
                }
            }
        });

        const button = screen.getByRole('button');
        await user.click(button);

        expect(clicked).toBe(false);
    });

    test('renders as link when href is provided', async () => {
        const user = userEvent.setup();

        render(Button, {
            props: {
                href: 'https://example.com'
            }
        });

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', 'https://example.com');

        await user.click(link);

        expect(link).toBeInTheDocument();
    });

    test('does not redirect when disabled href is provided', () => {
        render(Button, {
            props: {
                href: 'https://example.com',
                disabled: true
            }
        });

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('aria-disabled', 'true');
        //todo
    });

    test('applies button type', () => {
        render(Button, {
            props: {
                type: 'submit'
            }
        });

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('type', 'submit');
    });
});
