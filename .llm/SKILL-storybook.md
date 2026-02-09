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

Use `play()` with `step()` to group related actions.:

```typescript
import { withinPopover } from '@sb/models/popover';
import { expect, userEvent, waitFor, within } from 'storybook/test';

<Story name="Interactive" play={async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Open' });

    await step('Open menu', async () => {
        await userEvent.click(button);

        const popover = withinPopover();
        await waitFor(() => {
            const item = popover.getByRole('menuitem', { name: 'Option 1' });
            expect(item).toBeVisible();
        });
    });

    await step('Close menu', async () => {
        await userEvent.click(button, { pointerEventsCheck: 0 });
    });
}} />
```

### Query Priority

1. `getByRole()` - Most accessible, query by ARIA role
2. `getByLabelText()` - Form inputs by label
3. `getByText()` - By displayed text
4. `getByPlaceholderText()` - By placeholder
5. `getByAltText()` - Images by alt
6. `getByTestId()` - Last resort

**Query variants:**

- `getBy...` / `queryBy...` - Synchronous (no `await`)
- `findBy...` - Async (use `await`), waits for element to exist
- `getAllBy...` / `queryAllBy...` - Synchronous (no `await`), returns arrays

**Async patterns:**

- For elements already in DOM: Use `getBy...` (no `await`)
- For elements that need visibility check: Use `waitFor()` with `getBy...` + `expect().toBeVisible()`
- Avoid `findBy...` + separate `waitFor()` - combine in single `waitFor()` instead

### Common userEvent Methods & Assertions

**Methods**: `click()`, `dblClick()`, `hover()`, `type(element, text)`, `keyboard()`, `selectOptions()`, `clear()`, `tab()`

**Assertions**: `toBeVisible()`, `toBeInTheDocument()`, `toBeDisabled()`, `toHaveClass()`, `toHaveAttribute()`, `toHaveTextContent()`, `toHaveLength()`

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

Component level:

```typescript
const { Story } = defineMeta({
    component: MyComponent,
    async beforeEach() {
        initializeTestData();
        return () => resetTestData(); // Cleanup
    }
});
```

Global in `.storybook/preview.ts`:

```typescript
const preview: Preview = {
    async beforeAll() {
        /* Once at start */
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

- **Use steps**: Group related interactions with `step()` for clear test visualization
- **Query by role**: `getByRole()` is most accessible and recommended
- **No unnecessary async**: Don't `await` synchronous queries (`getBy...`, `queryBy...`)
- **Simplify waitFor**: Use `waitFor(() => { expect(...) })` without `async` if no `await` inside
- **Use `within()`**: Always use `within(canvasElement)` for scoped queries
- **Portal elements**: Use `withinPopover()` for popup/dropdown/dialog content
- **Combine checks**: Put element query + visibility check in single `waitFor()`
- **Meaningful names**: Describe state ("FilledForm", "WithError", "Disabled")
- **Focus stories**: One primary use case per story
- **Type safety**: Always use TypeScript

## Resources

- [Storybook Interaction Testing](https://storybook.js.org/docs/writing-tests/interaction-testing)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [CSF Format](https://storybook.js.org/docs/api/csf)
- [SvelteKit Storybook](https://storybook.js.org/docs/get-started/frameworks/sveltekit)
