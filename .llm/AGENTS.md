You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Project Configuration

### Tech Stack & Requirements

- **Framework**: Svelte 5 (rune mode only)
- **Backend Framework**: SvelteKit with remote functions
- **CSS**: Tailwind 4 with custom semantic color system
- **Testing**: Storybook 10 + vites-addon + @storybook/addon-svelte-csf
- **Language**: TypeScript (required for all code)

### Svelte Code Rules

1. Use only runes (`$state`, `$derived`, `$effect`, `$props`) - never legacy reactive syntax
2. Use TypeScript for type safety
3. Use remote functions for server-side logic and data fetching (not traditional load functions)

**Reference**: [SKILL-remote-functions.md](SKILL-remote-functions.md) for patterns and best practices.

### Storybook Stories

1. Use CSF (Component Story Format) only
2. Use TypeScript for type safety
3. Follow testing utilities from `storybook/test`

**Reference**: [SKILL-storybook.md](SKILL-storybook.md) for patterns and assertions.

### CSS & Styling

1. Use semantic color tokens only (never standard Tailwind colors)
2. Use custom theme colors: `bg-surface`, `bg-primary`, `bg-danger`, etc.
3. Always pair background colors with matching `text-on-*` variants

**Reference**: [SKILL-css.md](SKILL-css.md) for semantic colors and Tailwind patterns.

### UI Components

1. Box uses `containerClass` and `contentClass` (NOT `class`)
2. Stack uses `spacing` prop (NOT `gap`)
3. Use semantic color system and responsive props

**Reference**: [SKILL-components.md](SKILL-components.md) for component APIs and common patterns.

## Available MCP Tools

### 1. list-sections

Discover all documentation sections. Returns structured list with titles, use_cases, and paths. Use FIRST when asked about Svelte/SvelteKit topics.

### 2. get-documentation

Retrieves full documentation for specific sections (single or multiple). After list-sections, analyze use_cases and fetch ALL relevant sections.

### 3. svelte-autofixer

Analyzes Svelte code for issues and suggestions. Use whenever writing Svelte code before sending to user. Keep calling until no issues remain.

### 4. playground-link

Generates Svelte Playground link. After completing code, ask user if they want a link. Only use after confirmation and NEVER if code written to project files.
