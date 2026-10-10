---
name: storybook
description: Storybook 10 for visual component documentation. Use when writing or debugging .stories.svelte files for component showcases and design system documentation.
---

# Storybook - Svelte CSF v5

`storybook` 10.6 + `@storybook/sveltekit` + `@storybook/addon-svelte-csf` 5

Storybook here is **visual documentation only**: no `play` functions, no assertions. Logic tests go
to Vitest (`vitest-testing` skill), browser tests to Playwright (`playwright-testing` skill).

```bash
pnpm run storybook          # dev server on :6006
pnpm run build:storybook    # static build
```

## Quick start

`.stories.svelte`, `defineMeta` in a **module** script, explicit `title`:

```svelte
<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import Button from '@lib/ui/atoms/input/Button.svelte';

    const { Story } = defineMeta({
        component: Button,
        title: 'Atoms/Inputs/Button'
    });
</script>

<Story name="Default Action">Click Me</Story>
<Story name="Disabled" args={{ disabled: true }} />
```

`defineMeta` options: `component`, `title`, `render`, `args`, `argTypes`, `decorators`,
`parameters`, `tags`.

New top-level sections must be added to `storySort` in `.storybook/preview.ts` — anything unlisted
sorts alphabetically **after** everything listed, so a new folder silently lands at the bottom.

## Choosing the story form

Four forms. Pick by what the story needs:

| Form                            | Renders                                  | Args        | Use when                                              |
| ------------------------------- | ---------------------------------------- | ----------- | ----------------------------------------------------- |
| `<Story name="X" args={{…}} />` | the meta `component` with those args     | yes         | props alone describe the state                        |
| `<Story>…</Story>`              | children **inside** the meta `component` | yes         | the component needs children (a label, list items)    |
| `<Story asChild>…</Story>`      | the children **as** the whole story      | **ignored** | static composition — nesting, hierarchy, side-by-side |
| `{#snippet template(args)}`     | the snippet **instead of** the component | yes         | wrapper/provider, loops over variants, extra markup   |

**When choosing between the last two: use `template` only if the story reads `args`, otherwise
`asChild`.** A `template` that never reads `args` should be `asChild`. `asChild` disables Controls
but not reactivity.

`template` replaces the output — it does _not_ also render the meta `component` — so it's how you
wrap a component in a provider or a parent it requires.

Repeating one wrapper across stories? Pass it per story as `{template}`, or make it file-wide with
`defineMeta({ render: template })`:

```svelte
{#snippet template(args: MyArgs)}
    <Wrapper><MyComponent {...args} /></Wrapper>
{/snippet}

<Story name="A" {template} />
<Story name="B" />
<!-- B uses the file-wide render -->
```

Keep `render` for a wrapper that serves most stories, or when it carries the args type (below).
A `render` serving a single story is just indirection — inline it. And if stories differ only by
props, make them `args`-only one-liners on the file-wide `render` instead of near-identical
templates.

The snippet's optional second param is the story context: `{#snippet template(args, context)}`.

Story IDs are `title` + `name`, lowercased with separators stripped: `Components/App/AppMenu` +
`App menu` → `components-app-appmenu--app-menu`. Use `exportName` when a name would collide or
contains symbols (`name="Error → fallback" exportName="ErrorFallback"`).

## Typing args

When the args are just the component's props, inference handles it and no annotation is needed. When
you do want the type written out, use Svelte's `ComponentProps`:

```svelte
{#snippet template(args: ComponentProps<typeof Switch>)}
```

> The addon also exports an `Args<typeof Story>` helper, but **it does not work** in 5.1.5 — its
> conditional pins the component parameter, so it resolves to `never` and the snippet fails to
> type-check (`Rest types may only be created from object types`). Use `ComponentProps`.

**Story-only args** are args that aren't component props — a lorem preset picker, a mock-lookup
result. Declare them in the type of a `render` snippet: `defineMeta` infers its args type from that
snippet, so **no explicit `defineMeta<…>` generics are needed**. (`defineMeta<unknown, Component<…>>`
is the old workaround for this; don't add it.)

```svelte
<script module lang="ts">
    import Card, { type CardProps } from '@lib/ui/atoms/layouts/Card.svelte';

    type CardArgs = CardProps & { content?: string };

    const { Story } = defineMeta({
        component: Card,
        title: 'Atoms/Layouts/Card',
        render: template,
        args: { content: 'medium' },
        argTypes: {
            content: {
                control: { type: 'select' },
                options: ['none', 'short', 'medium', 'long'],
                mapping: { none: undefined, short: lorem.short, medium: lorem.medium, long: lorem.long }
            }
        }
    });
</script>

{#snippet template(args: CardArgs)}
    {@const { children, ...otherArgs } = args}
    <Card {...otherArgs}>{args.content}</Card>
{/snippet}

<Story name="Box like" />
```

Live examples: `Card.stories.svelte`, `Dialog.stories.svelte`, `UserName.stories.svelte`.

Two gotchas:

- **Drop `children` before spreading.** `{@const { children, ...otherArgs } = args}`, then spread
  `otherArgs`; spreading a `children` arg would override the children the markup actually passes.
- **`render:` + an instance `<script>` breaks `svelte-check`** with _"Block-scoped variable
  'template' used before its declaration"_. Move that state into `<script module>` (a story file has
  one instance, so sharing is harmless), as `Dialog.stories.svelte` does.

## Controls

```svelte
argTypes: {
    disabled: { control: { type: 'boolean' } },
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    align: { control: { type: 'inline-radio' }, options: ['start', 'end', 'center'] }
}
```

**Optional enum props use the `default` sentinel.** A select can't express "prop absent", so add a
`'default'` option mapped back to `undefined`, letting the component apply its own default:

```svelte
color: {
    control: { type: 'select' },
    options: ['default', ...actionColorList],
    mapping: { default: undefined }
}
```

Numeric props (spacing, padding) need the same treatment, since `options` entries are strings: the
existing stories use a space-prefixed label (`' 4'`) mapped back to the number `4` — see the
`spacingList.reduce(...)` blocks in `Box`/`Card`/`Stack`.

Don't write `args: {}` or list args that only exist to register a control; `argTypes` is enough.

Skip `description` / `table` metadata — the Controls panel renders Name and Control only, so it has
no effect here.

## Repo helpers (`@sb` → `src/storybook/`)

A global decorator in `.storybook/preview.ts` wraps **every** story in `AppLayoutMock`, which
provides the locale and theme contexts wired to the toolbar dropdowns, plus a `#popover` portal
target. So:

- Use the **toolbar** to check themes and locales — don't add per-story theme decorators.
- Don't add your own `<div id="popover">`.
- A component that needs only locale/theme context needs no extra wrapper in its story.

| Helper                   | Use for                                                             |
| ------------------------ | ------------------------------------------------------------------- |
| `MockApp.svelte`         | the `<App>` shell — required for menu/connection context            |
| `MockAuthContext.svelte` | an authenticated current user                                       |
| `MockUserStore.svelte`   | public-user lookups: `{ kind: 'resolved' \| 'pending' \| 'error' }` |
| `lorem.ts`               | `lorem.short` / `.medium` / `.long` filler                          |
| `ColorSample.svelte`     | colour swatches with computed hex                                   |

A mock provider sets context with a **getter**, not a destructured const (which would snapshot the
value and freeze Control edits):

```svelte
let { user, children } = $props();
setAuthenticatedUserContext({
    get user() {
        return user;
    },
    refresh: () => Promise.resolve()
});
```

Writing a decorator? Return the wrapper and let the renderer mount the story as its `children`.
**Don't call `story()` yourself** — doing so mounts the story twice and bypasses the renderer's
filtering of synthesized `event_*` args:

```ts
decorators: [(_story, context) => ({ Component: Wrapper, props: { … } })];
```

## Interactive state

Constants go in the module script, runes in the instance script. Anything `defineMeta` references
(including a snippet passed to `render`) must be module-scoped, since `defineMeta` itself runs
there:

```svelte
<script module lang="ts">
    const presets = [0, 25, 50, 100]; // arg-independent -> module scope
</script>

<script lang="ts">
    let value = $state(50);
</script>
```

Prefer `{#snippet}` + `{@render}` over copy-paste for "All Colors / All Sizes / All Variants"
stories — see the `buttonSet` / `inputSet` snippets in the input stories. Keep `{#each}` keyed.

## Actions

```svelte
<script module lang="ts">
    // core path, NOT @storybook/addon-actions
    import { action } from 'storybook/actions';

    const { Story } = defineMeta({
        component: ComboButton,
        args: { options: [{ caption: 'Option 1', onclick: action('Option 1 click') }] }
    });
</script>
```

## SvelteKit mocking

Per-story `parameters`, only when a component actually reads `$app/*`:

```svelte
<Story
    name="With Page Data"
    parameters={{
        sveltekit_experimental: {
            state: { page: { data: { user: { id: '123' } } } },
            navigation: { afterNavigate: () => {} },
            hrefs: { '/login': () => {} }
        }
    }}
/>
```

Keys: `state` (`page`/`navigating`/`updated`), `navigation`, `hrefs`, `forms`. **Ignore the `stores`
key** — `$app/stores` is removed in SvelteKit 3 and throws at runtime; use `state`.

## Conventions

- One story per state, named for the state: `Default`, `Disabled`, `All Colors`, `In Box`.
- Realistic content, not `foo`/`bar`.
- No `play` functions, no assertions.
- TypeScript everywhere; no unused imports (ESLint reports these in stories).
- Run `svelte-autofixer` on story markup before finishing, same as any Svelte file.

## Gaps to know about

- Not installed, so don't reach for them: **`@storybook/addon-a11y`**, **`@storybook/addon-vitest`**.
- `eslint-plugin-storybook` _is_ installed, but its rules are globbed to
  `*.stories.@(ts|tsx|js|jsx|mjs|cjs)` — **none apply to `.stories.svelte`**. Only
  `storybook/no-uninstalled-addons` is live, on `.storybook/main.ts`. Don't rely on lint to catch CSF
  mistakes.

## Verifying a story actually renders

`pnpm run check` and `pnpm run lint` cannot see a story that throws while rendering, so run:

```bash
pnpm run test:storybook   # boots Storybook, loads every story, fails on console errors
```

CI runs the same command in its own parallel `storybook` job. To chase a single story by hand, start
the dev server: `http://localhost:6006/index.json` lists every story ID, so load
`iframe.html?id=<id>&viewMode=story` and watch the console. Append `&args=key:value` to confirm args
reach the template.

A story that deliberately provokes an error (an error-state story) must be added to
`EXPECTED_CONSOLE_ERRORS` in `scripts/smoke-storybook.ts`, or the smoke run will flag it.

## Resources

- [Svelte CSF addon README](https://github.com/storybookjs/addon-svelte-csf) — the authority for `Story` props
- [Storybook CSF](https://storybook.js.org/docs/api/csf) · [Controls](https://storybook.js.org/docs/essentials/controls) · [SvelteKit framework](https://storybook.js.org/docs/get-started/frameworks/sveltekit)
