# Shine Web V2 - Project Rules

## 🚨 Critical Rules

1. **`pnpm` only** - Never use npm/yarn
2. **Svelte 5 runes only** - `$state`, `$derived`, `$effect`, `$props`
3. **Tailwind 4 + semantic colors** - `bg-primary` NOT `bg-blue-500`
4. **Invoke skills** with `/skill-name` for detailed guides

## Tech Stack

- **Framework:** Svelte 5 (runes), SvelteKit
- **Server:** Remote functions (`query`, `form`, `command`)
- **CSS:** Tailwind 4 with semantic tokens
- **Testing:** Storybook 10 (CSF + TypeScript)

## Component Priority

1. Use component props first
2. Use utility classes second
3. Suggest component enhancement for repeated patterns

**Key quirks:**

- Box: use `containerClass`/`contentClass` (NOT `class`)
- Stack: use `spacing` prop (NOT `gap` class)

## Skills (invoke with `/skill-name`)

- **`/components`** - UI component APIs, props, patterns
- **`/css`** - Tailwind 4 config, semantic colors, best practices
- **`/storybook`** - CSF format, play functions, testing patterns
- **`/remote-functions`** - Query, form, command patterns

## Environment Setup

Use these scripts for environment configuration or long-running automated tasks:

```bash
pnpm run env:mock   # Setup MSW + mock environment
pnpm run env:local  # Local environment config
pnpm run env:dev    # Dev environment config
pnpm run env:prod   # Production environment config
```

## MCP Tools

- **`svelte-autofixer`** - Run on ALL Svelte code before sending
- **`list-sections`** / **`get-documentation`** - Fetch Svelte 5 docs
- **`playground-link`** - Generate playground (ask user first)
