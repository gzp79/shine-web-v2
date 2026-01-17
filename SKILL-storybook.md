# Storybook 10 Testing Guide

## Quick Start

Use **CSF** (Component Story Format) with `.stories.svelte` and TypeScript:

```typescript
<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import MyComponent from './MyComponent.svelte';

  const { Story } = defineMeta({
    component: MyComponent,
    tags: ['autodocs'],
  });
</script>

<Story name="Default" args={{ label: 'Click me' }} />
<Story name="Disabled" args={{ label: 'Disabled', disabled: true }} />
```

Key `defineMeta()` options: `component`, `title`, `decorators`, `parameters`, `tags`

## Args & Rendering

Pass data via `args`. Use spread operator to reuse story states:

```typescript
export const Primary = {
    args: { label: 'Primary', variant: 'primary' }
};

export const Secondary = {
    ...Primary,
    args: { ...Primary.args, variant: 'secondary' }
};
```

For complex layouts, use render functions with snippets:

```typescript
<Story name="InModal" args={{ message: 'Hello' }}>
  {#snippet template(args)}
    <Modal><MyComponent {...args} /></Modal>
  {/snippet}
</Story>
```

## Interaction Testing

Use `play()` with `step()` to group related actions and make tests readable:

```typescript
import { expect, userEvent } from 'storybook/test';

export const FormSubmission = {
    play: async ({ canvas, userEvent, step }) => {
        await step('Fill credentials', async () => {
            await userEvent.type(canvas.getByLabelText('Email'), 'user@example.com');
            await userEvent.type(canvas.getByLabelText('Password'), 'secret123');
        });

        await step('Submit form', async () => {
            await userEvent.click(canvas.getByRole('button', { name: /submit/i }));
        });

        await expect(canvas.getByText('Success!')).toBeInTheDocument();
    }
};
```

### Query Priority

1. `getByRole()` - Most accessible, query by ARIA role
2. `getByLabelText()` - Form inputs by label
3. `getByText()` - By displayed text
4. `getByPlaceholderText()` - By placeholder
5. `getByAltText()` - Images by alt
6. `getByTestId()` - Last resort

Query variants: `getBy...`, `queryBy...` (null if missing), `findBy...` (async), and plural `getAllBy...`

### Common userEvent Methods

- `click()`, `dblClick()`, `hover()`, `unhover()`
- `type(element, text)`, `keyboard('{Shift>}A{/Shift}')`
- `selectOptions()`, `deselectOptions()`, `clear()`
- `tab()`

### Assertions

```typescript
await expect(element).toBeVisible();
await expect(element).toBeInTheDocument();
await expect(element).toBeDisabled();
await expect(element).toHaveClass('active');
await expect(element).toHaveAttribute('aria-label', 'Close');
await expect(element).toHaveTextContent('Welcome');
await expect(element).toHaveLength(3);
```

### Spy on Functions

```typescript
import { fn } from 'storybook/test';

export const ClickHandler = {
    args: { onClick: fn() },
    play: async ({ args, canvas, userEvent }) => {
        await userEvent.click(canvas.getByRole('button'));
        await expect(args.onClick).toHaveBeenCalled();
    }
};
```

## Setup & Teardown

Run via `beforeEach()` at component level or globally in `.storybook/preview.ts`:

```typescript
const { Story } = defineMeta({
    component: MyComponent,
    async beforeEach() {
        initializeTestData();
        return () => resetTestData(); // Cleanup
    }
});
```

At preview level for global setup:

```typescript
const preview: Preview = {
    async beforeAll() {
        /* Runs once at start */
    },
    async beforeEach() {
        /* Before each story */
    }
};
```

## SvelteKit Mocking

Mock `$app/*` modules in story parameters:

```typescript
<Story name="WithData" parameters={{
  sveltekit_experimental: {
    state: { page: { data: { user: { id: '123', name: 'Test' } } } },
  },
}}>
  <MyComponent />
</Story>
```

Available: `state`, `stores`, `forms`, `navigation`, `hrefs`

## Best Practices

- **Use steps**: Group related interactions with `step()` for readability
- **Query by role**: `getByRole()` is most accessible
- **Meaningful names**: Describe state ("FilledForm", "WithError", "Disabled")
- **Focus stories**: One primary use case per story
- **Tag for docs**: Add `tags: ['autodocs']` to auto-generate documentation
- **Type safety**: Always use TypeScript

## Common Patterns

**Form submission**:

```typescript
export const SubmitSuccess = {
    play: async ({ canvas, userEvent, step }) => {
        await step('Fill form', async () => {
            await userEvent.type(canvas.getByLabelText('Username'), 'testuser');
        });
        await step('Submit', async () => {
            await userEvent.click(canvas.getByRole('button', { name: /submit/i }));
        });
        await expect(canvas.getByText('Success!')).toBeInTheDocument();
    }
};
```

**Conditional rendering**:

```typescript
export const WithCondition = {
    args: { showContent: true },
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Conditional content')).toBeVisible();
    }
};
```

**Error states**:

```typescript
export const WithError = {
    args: { hasError: true, errorMessage: 'Invalid email' },
    play: async ({ canvas }) => {
        await expect(canvas.getByRole('alert')).toHaveTextContent('Invalid email');
    }
};
```

## Resources

- [Storybook Interaction Testing](https://storybook.js.org/docs/writing-tests/interaction-testing)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [CSF Format](https://storybook.js.org/docs/api/csf)
- [SvelteKit Storybook](https://storybook.js.org/docs/get-started/frameworks/sveltekit)
