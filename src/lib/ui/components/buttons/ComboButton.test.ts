import { setupPortal, step, withinPortal } from '@testing';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import ComboButton from './ComboButton.svelte';

const portal = setupPortal();

beforeEach(portal.beforeEach);
afterEach(portal.afterEach);

describe('ComboButton', () => {
    test('renders current option', () => {
        render(ComboButton, {
            props: {
                options: [
                    { caption: 'Option 1', onclick: () => {} },
                    { caption: 'Option 2', onclick: () => {} },
                    { caption: 'Option 3', onclick: () => {} }
                ],
                current: 0
            }
        });

        const button = screen.getByRole('button', { name: 'Option 1' });
        expect(button).toBeInTheDocument();
    });

    test('calls onclick handler for current option', async () => {
        const user = userEvent.setup();
        let clicked = false;

        render(ComboButton, {
            props: {
                options: [
                    {
                        caption: 'Option 1',
                        onclick: () => {
                            clicked = true;
                        }
                    },
                    { caption: 'Option 2', onclick: () => {} }
                ],
                current: 0
            }
        });

        const button = screen.getByRole('button', { name: 'Option 1' });
        await user.click(button);

        expect(clicked).toBe(true);
    });

    test('renders dropdown trigger button', () => {
        render(ComboButton, {
            props: {
                options: [
                    { caption: 'Option 1', onclick: () => {} },
                    { caption: 'Option 2', onclick: () => {} },
                    { caption: 'Option 3', onclick: () => {} }
                ],
                current: 0
            }
        });

        // Verify both buttons are rendered (main button and dropdown trigger)
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(2);
    });

    test('renders with disabled state', () => {
        render(ComboButton, {
            props: {
                options: [
                    { caption: 'Option 1', onclick: () => {} },
                    { caption: 'Option 2', onclick: () => {} }
                ],
                current: 0,
                disabled: true
            }
        });

        const buttons = screen.getAllByRole('button');
        expect(buttons[0]).toBeDisabled(); // Main button
        expect(buttons[1]).toBeDisabled(); // Dropdown trigger
    });

    test('does not call onclick when disabled', async () => {
        const user = userEvent.setup();
        let clicked = false;

        render(ComboButton, {
            props: {
                options: [
                    {
                        caption: 'Option 1',
                        onclick: () => {
                            clicked = true;
                        }
                    }
                ],
                current: 0,
                disabled: true
            }
        });

        const button = screen.getByRole('button', { name: 'Option 1' });
        await user.click(button);

        expect(clicked).toBe(false);
    });

    test('renders action button as link when href option is selected', async () => {
        const user = userEvent.setup();

        render(ComboButton, {
            props: {
                options: [{ caption: 'Go to example', href: 'https://example.com' }],
                current: 0
            }
        });

        const actionLink = screen.getByRole('link', { name: 'Go to example' });
        expect(actionLink).toHaveAttribute('href', 'https://example.com');

        await user.click(actionLink);
        expect(actionLink).toBeInTheDocument();
    });

    test('switches to href option and navigates on action click', async () => {
        const user = userEvent.setup();
        let clicked = false;

        render(ComboButton, {
            props: {
                options: [
                    {
                        caption: 'Action 1',
                        onclick: () => {
                            clicked = true;
                        }
                    },
                    { caption: 'Go to example', href: 'https://example.com' }
                ],
                current: 0
            }
        });

        await step('verify initial button state', () => {
            const actionButton = screen.getByRole('button', { name: 'Action 1' });
            expect(actionButton).toBeInTheDocument();
        });

        await step('open dropdown and select link option', async () => {
            const dropdownTrigger = screen.getAllByRole('button')[1]!;
            await user.click(dropdownTrigger);

            const portal = withinPortal('popover');
            const menuItem = portal.getByRole('menuitem', { name: 'Go to example' });
            await user.click(menuItem);
        });

        await step('verify button switched to link', async () => {
            const actionLink = await screen.findByRole('link', { name: 'Go to example' });
            expect(actionLink).toHaveAttribute('href', 'https://example.com');
            expect(clicked).toBe(false);
        });
    });
});
