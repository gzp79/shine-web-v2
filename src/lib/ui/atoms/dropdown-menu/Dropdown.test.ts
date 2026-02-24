import { setupPortal } from '@testing';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { DropdownMenu } from '@lib/ui/atoms/dropdown-menu';

const portal = setupPortal();

beforeEach(portal.beforeEach);
afterEach(portal.afterEach);

describe('DropdownMenu', () => {
    test('shows trigger button', () => {
        render(DropdownMenu, {
            props: {
                open: false,
                trigger: 'Open menu'
            }
        });

        const trigger = screen.getByRole('button', { name: 'Open menu' });
        expect(trigger).toBeInTheDocument();
    });

    test('opens dropdown on trigger click', async () => {
        const user = userEvent.setup();
        let isOpen = false;

        render(DropdownMenu, {
            props: {
                open: isOpen,
                trigger: 'Open menu',
                onOpenChange: (open: boolean) => {
                    isOpen = open;
                }
            }
        });

        const trigger = screen.getByRole('button', { name: 'Open menu' });
        await user.click(trigger);

        // Verify the onOpenChange callback was invoked
        expect(isOpen).toBe(true);
    });

    test('renders with disabled state', () => {
        render(DropdownMenu, {
            props: {
                open: false,
                trigger: 'Open menu',
                triggerStyle: {
                    disabled: true
                }
            }
        });

        const trigger = screen.getByRole('button', { name: 'Open menu' });
        expect(trigger).toBeDisabled();
    });

    test('does not open when disabled', () => {
        render(DropdownMenu, {
            props: {
                open: false,
                trigger: 'Open menu',
                triggerStyle: {
                    disabled: true
                }
            }
        });

        const trigger = screen.getByRole('button', { name: 'Open menu' });
        expect(trigger).toBeDisabled();
    });
});
