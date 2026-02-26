import { renderWithLayout } from '@testing';
import { cleanup, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test } from 'vitest';
import { z } from 'zod';
import ZodField from './ZodField.svelte';

const emailSchema = z.email({ message: 'Please enter a valid email address' });
const ageSchema = z
    .number()
    .min(18, { message: 'You must be at least 18 years old' })
    .max(120, { message: 'Age must be less than or equal to 120' });

afterEach(() => {
    cleanup();
});

describe('ZodField - Email Validation', () => {
    test('shows validation error for invalid email', async () => {
        const user = userEvent.setup();
        let validated: string | undefined;

        renderWithLayout(ZodField, {
            type: 'email',
            schema: emailSchema,
            rawInput: '',
            label: 'Email Address',
            required: true,
            onValue: (val: string | undefined) => {
                validated = val;
            }
        });

        const input = screen.getByRole('textbox');
        await user.clear(input);
        await user.type(input, 'invalid-email');

        expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email address');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(validated).toBeUndefined();
    });

    test('validates correct email and clears error', async () => {
        const user = userEvent.setup();
        let validated: string | undefined;

        renderWithLayout(ZodField, {
            type: 'email',
            schema: emailSchema,
            rawInput: '',
            label: 'Email Address',
            required: true,
            onValue: (val: string | undefined) => {
                validated = val;
            }
        });

        const input = screen.getByRole('textbox');
        await user.clear(input);
        await user.type(input, 'valid@example.com');

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(input).not.toHaveAttribute('aria-invalid', 'true');
        expect(validated).toBe('valid@example.com');
    });
});

describe('ZodField - Age Validation', () => {
    test('shows validation error for age below minimum', async () => {
        const user = userEvent.setup();
        let validated: number | undefined;

        renderWithLayout(ZodField, {
            type: 'number',
            schema: ageSchema,
            rawInput: '',
            label: 'Age',
            required: true,
            onValue: (val: number | undefined) => {
                validated = val;
            }
        });

        const input = screen.getByRole('spinbutton');
        await user.clear(input);
        await user.type(input, '15');

        expect(screen.getByRole('alert')).toHaveTextContent('You must be at least 18 years old');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(validated).toBeUndefined();
    });

    test('validates correct age', async () => {
        const user = userEvent.setup();
        let validated: number | undefined;

        renderWithLayout(ZodField, {
            type: 'number',
            schema: ageSchema,
            rawInput: '',
            label: 'Age',
            required: true,
            onValue: (val: number | undefined) => {
                validated = val;
            }
        });

        const input = screen.getByRole('spinbutton');
        await user.clear(input);
        await user.type(input, '25');

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(input).not.toHaveAttribute('aria-invalid', 'true');
        expect(validated).toBe(25);
    });

    test('shows validation error for age above maximum', async () => {
        const user = userEvent.setup();
        let validated: number | undefined;

        renderWithLayout(ZodField, {
            type: 'number',
            schema: ageSchema,
            rawInput: '',
            label: 'Age',
            required: true,
            onValue: (val: number | undefined) => {
                validated = val;
            }
        });

        const input = screen.getByRole('spinbutton');
        await user.clear(input);
        await user.type(input, '150');

        expect(screen.getByRole('alert')).toHaveTextContent('Age must be less than or equal to 120');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(validated).toBeUndefined();
    });
});
