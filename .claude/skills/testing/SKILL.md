---
name: testing
description: Component testing with Vitest and @testing-library/svelte. Use when writing or debugging *.test.ts files.
---

# Component Testing

## Basic Pattern

```typescript
import { step } from '@testing';
import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test } from 'vitest';

afterEach(() => cleanup());

describe('ComponentName', () => {
    test('simple behavior', async () => {
        const user = userEvent.setup();
        render(Component, {
            props: {
                /* ... */
            }
        });

        await user.click(screen.getByRole('button'));

        expect(screen.getByRole('button')).toBeDisabled();
    });

    test('complex multi-step behavior', async () => {
        const user = userEvent.setup();
        render(Component, {
            props: {
                /* ... */
            }
        });

        await step('fill and submit form', async () => {
            await user.type(screen.getByRole('textbox'), 'value');
            await user.click(screen.getByRole('button', { name: 'Submit' }));
        });

        await step('verify success message', async () => {
            expect(await screen.findByText('Success')).toBeInTheDocument();
        });
    });
});
```

## Queries - Choose by Timing

```typescript
// ✅ Element exists immediately
const button = screen.getByRole('button');

// ✅ Check element does NOT exist
expect(screen.queryByRole('alert')).not.toBeInTheDocument();

// ✅ Element appears after async operation (PREFER over waitFor)
const message = await screen.findByText('Loaded');

// ✅ Multiple elements
const items = screen.getAllByRole('listitem');
```

## Query Priority

1. `getByRole('button')` - Accessible, robust
2. `getByLabelText('Email')` - Form labels
3. `getByPlaceholderText()` - Placeholders
4. `getByText('Submit')` - Text content
5. `getByTestId()` - Last resort

### Common Roles

```typescript
screen.getByRole('button', { name: 'Submit' });
screen.getByRole('textbox'); // text input, textarea
screen.getByRole('spinbutton'); // number input
screen.getByRole('checkbox');
screen.getByRole('link');
screen.getByRole('alert'); // Error messages
screen.getByRole('dialog');
screen.getByRole('menuitem');
```

## Interactions

```typescript
const user = userEvent.setup();
await user.click(element);
await user.type(input, 'text');
await user.clear(input);
await user.tab();
```

## Assertions

```typescript
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toHaveTextContent('Hello');
expect(button).toBeDisabled();
expect(input).toHaveValue('text');
expect(input).toHaveAttribute('aria-invalid', 'true');
expect(checkbox).toBeChecked();
```

## Async - Use findBy

```typescript
// ✅ Element appears after action
await user.click(button);
const message = await screen.findByText('Saved');

// ✅ Custom timeout
const slow = await screen.findByText('Slow', {}, { timeout: 5000 });

// ❌ Don't use waitFor + getBy
// await waitFor(() => screen.getByText('Saved'));
```

## Multi-Step Tests

Use the `step()` helper to organize complex tests into logical steps with logging.

```typescript
import { step } from '@testing';

test('complex workflow', async () => {
    render(Component, {
        props: {
            /* ... */
        }
    });

    await step('initial state', () => {
        expect(screen.getByRole('button')).toBeEnabled();
    });

    await step('user interaction', async () => {
        await user.click(screen.getByRole('button'));
    });

    await step('verify result', async () => {
        expect(await screen.findByText('Success')).toBeInTheDocument();
    });
});
```

## Testing Portals

Use `setupPortal()` to handle portal setup/teardown automatically.

```typescript
import { setupPortal, withinPortal } from '@testing';

const portal = setupPortal();

beforeEach(portal.beforeEach);
afterEach(portal.afterEach);

test('dropdown menu', async () => {
    const user = userEvent.setup();
    render(Dropdown, { props: { open: true } });

    const portalContent = withinPortal('popover');
    await user.click(portalContent.getByRole('menuitem', { name: 'Option 1' }));
});
```

## Rules

**DO:**

- Always `afterEach(() => cleanup())`
- Query by role (accessible, robust)
- Use `findBy` for async (NOT `waitFor` + `getBy`)
- Use `queryBy` for asserting absence
- Test user behavior, not implementation
- One focused concept per test
- Use `step()` helper for complex multi-step tests
- Use `withinPortal()` helper for testing portal content

**DON'T:**

- Use `component.$set()` (Svelte 5 doesn't support it)
- Use `await tick()` (use `findBy` instead)
- Use `waitFor` + `getBy` (use `findBy` directly)
- Query by class/ID (use semantic queries)
- Test implementation details

**Run:** `pnpm test:unit` or `pnpm test:unit-ui`
