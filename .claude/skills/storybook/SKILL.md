---
name: storybook
description: Storybook 10 for visual component documentation. Use when writing or debugging .stories.svelte files for component showcases and design system documentation.
---

# Storybook 10 - Visual Documentation Guide

**Important**: Storybook is for **visual documentation only**. For component testing, use Vitest with `@testing-library/svelte` (see `/testing` skill).

## Quick Start

Use **CSF** (Component Story Format) with `.stories.svelte` and TypeScript:

```svelte
<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import MyComponent from './MyComponent.svelte';

    const { Story } = defineMeta({
        title: 'Components/MyComponent',
        component: MyComponent,
        tags: ['autodocs']
    });
</script>

<Story name="Default" args={{ label: 'Click me' }} />
<Story name="Disabled" args={{ label: 'Disabled', disabled: true }} />
```

Key `defineMeta()` options: `component`, `title`, `decorators`, `parameters`, `tags`, `args`, `argTypes`

## Args & Controls

Pass data via `args` to make stories interactive:

```svelte
<script module lang="ts">
    const { Story } = defineMeta({
        component: Button,
        args: {
            variant: 'primary',
            size: 'md',
            disabled: false
        },
        argTypes: {
            variant: {
                control: { type: 'select' },
                options: ['primary', 'secondary', 'danger']
            },
            size: {
                control: { type: 'select' },
                options: ['sm', 'md', 'lg']
            },
            disabled: {
                control: { type: 'boolean' }
            }
        }
    });
</script>

<Story name="Primary" />
<Story name="Secondary" args={{ variant: 'secondary' }} />
<Story name="Disabled" args={{ disabled: true }} />
```

## Custom Rendering with Snippets

For complex layouts or component compositions, use the `template` snippet:

```svelte
<Story name="In Modal">
    {#snippet template(args)}
        <Modal>
            <MyComponent {...args} />
        </Modal>
    {/snippet}
</Story>

<Story name="With Surrounding Content">
    {#snippet template(args)}
        <Stack spacing={4}>
            <Typography variant="h2">Component Showcase</Typography>
            <MyComponent {...args} />
            <Typography variant="caption">Additional context here</Typography>
        </Stack>
    {/snippet}
</Story>
```

A per-`Story` `template` adds surrounding content but still renders the meta
`component` itself. To wrap the component in a **provider/context**, that's not
enough — see "Wrapping a Component" below.

## Wrapping a Component (providers, contexts, required parents)

A per-`Story` `template` is **forwarded into the meta `component` as children** — it does not replace it. So you can't use it to wrap the component in a provider: the addon still renders a bare, provider-less copy (the autodocs render always does), which crashes any component that reads a context it isn't given (`getXContext: called outside ...`).

App components usually hit this — they read auth/menu/theme/locale context. Wrap with `render: template`: set the wrapper as the meta-level default render so it also covers the autodocs render. The snippet is **module-scoped**, so it can only use module imports + `args` (no instance `<script>` state); supply theme/locale via the global decorator in `.storybook/preview.ts`. Type the `args` param to avoid an implicit-`any`.

```svelte
<script module lang="ts">
    import LanguageMenu, { type LanguageMenuProps } from '@lib/i18n/LanguageMenu.svelte';
    import { DropdownMenu } from '@lib/ui/atoms/dropdown-menu';

    const { Story } = defineMeta({ component: LanguageMenu, render: template });
</script>

{#snippet template(args: LanguageMenuProps)}
    <DropdownMenu open trigger="Settings"><LanguageMenu {...args} /></DropdownMenu>
{/snippet}

<Story name="Default" />
<Story name="LeftExpand" args={{ expandIcon: 'left' }} />
```

A mock provider is a tiny component that takes the value as a prop and sets the context with a **getter** (not a destructured const, which would snapshot it) so Control edits stay reactive — see `src/storybook/MockAuthContext.svelte`.

## Showcasing Component States

Create stories for different states and variants:

```svelte
<script module lang="ts">
    const { Story } = defineMeta({
        component: Input
    });
</script>

<Story name="Empty" args={{ value: '' }} />
<Story name="Filled" args={{ value: 'Hello World' }} />
<Story name="With Error" args={{ value: 'invalid', error: 'Invalid input' }} />
<Story name="Disabled" args={{ value: 'Disabled', disabled: true }} />
<Story name="Loading" args={{ loading: true }} />
```

## Reusable Snippets

Use snippets to reduce duplication across stories:

```svelte
<script lang="ts">
    const colors = ['primary', 'secondary', 'danger', 'warning'];
</script>

{#snippet buttonSet(args)}
    <Stack direction="row" spacing={2}>
        <Button {...args}>Click Me</Button>
        <Button {...args} disabled>Disabled</Button>
        <Button {...args}><Icon />With Icon</Button>
    </Stack>
{/snippet}

<Story name="All Colors">
    {#snippet template(args)}
        {@const { color, ...otherArgs } = args}
        <Stack>
            {#each colors as color (color)}
                <div>
                    <Typography>{color}</Typography>
                    {@render buttonSet({ ...otherArgs, color })}
                </div>
            {/each}
        </Stack>
    {/snippet}
</Story>
```

## Interactive State with Runes

For interactive demonstrations, use Svelte 5 runes:

```svelte
<script module lang="ts">
    const { Story } = defineMeta({
        component: Dialog
    });
</script>

<script lang="ts">
    let isOpen = $state(false);
    let selectedValue = $state('');
</script>

<Story name="Manual Control">
    {#snippet template(args)}
        <Button onclick={() => (isOpen = true)}>Open Dialog</Button>
        <Dialog bind:open={isOpen} {...args}>Dialog content here</Dialog>
    {/snippet}
</Story>

<Story name="Select Demo">
    {#snippet template(args)}
        <Select bind:value={selectedValue} {...args}>
            <option value="a">Option A</option>
            <option value="b">Option B</option>
        </Select>
        <p>Selected: {selectedValue || '(none)'}</p>
    {/snippet}
</Story>
```

## Actions for Event Handlers

Use Storybook actions to log events:

```svelte
<script module lang="ts">
    import { action } from 'storybook/actions';

    const { Story } = defineMeta({
        component: Button,
        args: {
            onclick: action('button clicked')
        }
    });
</script>

<Story name="With Action" />
```

## SvelteKit Mocking

Mock `$app/*` modules in story parameters:

```svelte
<Story
    name="With Page Data"
    parameters={{
        sveltekit_experimental: {
            state: {
                page: {
                    data: { user: { id: '123', name: 'Test User' } }
                }
            }
        }
    }}
>
    <MyComponent />
</Story>
```

Available: `state`, `stores`, `forms`, `navigation`, `hrefs`

## Component Props Documentation

Use `argTypes` to document component props:

```svelte
<script module lang="ts">
    const { Story } = defineMeta({
        component: Button,
        argTypes: {
            variant: {
                control: { type: 'select' },
                options: ['primary', 'secondary', 'danger'],
                description: 'Visual style variant',
                table: {
                    type: { summary: 'string' },
                    defaultValue: { summary: 'primary' }
                }
            },
            disabled: {
                control: { type: 'boolean' },
                description: 'Disables the button'
            },
            onclick: {
                action: 'clicked',
                description: 'Click event handler'
            }
        }
    });
</script>
```

## Best Practices

- **Pure visual documentation**: No play functions or automated tests
- **One story per state**: Focus each story on a specific use case or state
- **Meaningful names**: Describe the state ("Empty", "Filled", "WithError", "Disabled")
- **Use controls**: Make stories interactive with `args` and `argTypes`
- **Show variants**: Create stories for all visual variants (colors, sizes, states)
- **Real content**: Use realistic data that represents actual usage
- **Responsive**: Consider showing stories at different viewport sizes
- **Accessibility**: Document accessible states (focus, hover, disabled)
- **Type safety**: Always use TypeScript for better development experience

## Testing

**Do not use Storybook for testing.** Component tests belong in `*.test.ts` files using Vitest and `@testing-library/svelte`. See the `/testing` skill for details.

## Resources

- [Storybook CSF Format](https://storybook.js.org/docs/api/csf)
- [Storybook Controls](https://storybook.js.org/docs/essentials/controls)
- [SvelteKit Storybook](https://storybook.js.org/docs/get-started/frameworks/sveltekit)
- [Storybook Actions](https://storybook.js.org/docs/essentials/actions)
