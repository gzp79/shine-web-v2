# Shine Web V2 - Project Rules

## 🚨 Critical Rules

1. **`pnpm` only** - Never use npm/yarn
2. **Svelte 5 runes only** - `$state`, `$derived`, `$effect`, `$props`
3. **Tailwind 4 + semantic colors** - `bg-primary` NOT `bg-blue-500`
4. **Invoke skills** with `/skill-name` for detailed guides

## Stack

- **Framework:** Svelte 5 (runes) + SvelteKit
- **Server:** Remote functions (`query`, `form`, `command`)
- **CSS:** Tailwind 4 (semantic tokens)
- **Testing:** Vitest (unit), Playwright (integration/E2E), Storybook 10 (visual)

## Component Usage

**Priority:** Component props → utility classes → suggest enhancement for patterns

**Quirks:**

- Box: `containerClass`/`contentClass` (NOT `class`)
- Stack: `spacing` prop (NOT `gap` class)

## Environment

```bash
pnpm run env:mock   # MSW mocks (for testing)
pnpm run env:local  # Local backend
pnpm run env:dev    # Dev backend
pnpm run env:prod   # Production
```

## MCP (Svelte)

- `svelte-autofixer` - Run on ALL Svelte code before sending
- `list-sections` / `get-documentation` - Fetch Svelte 5 docs
- `playground-link` - Generate playground (ask user first)
