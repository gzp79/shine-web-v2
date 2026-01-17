You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Project Configuration

### Tech Stack & Requirements

- **Framework**: Svelte 5 (rune mode only)
- **Backend Framework**: SvelteKit with remote functions
- **CSS**: Tailwind 4 with some custom utilities in app.css file
- **Testing**: Storybook 10 + vites-addon + @storybook/addon-svelte-csf
- **Language**: TypeScript (required for all code)

### Svelte Code Rules

When writing Svelte components and scripts:

1. **MANDATORY**: Use only runes (`$state`, `$derived`, `$effect`, `$props`) - never use legacy reactive syntax
2. **MANDATORY**: Use TypeScript for type safety
3. **REQUIRED**: Use remote functions for server-side logic and data fetching (not traditional load functions)

**Reference**: [SKILL-remote-functions.md](SKILL-remote-functions.md) for patterns, validation, and best practices.

### Storybook Stories

When creating or editing story files (`.stories.svelte`):

1. **MANDATORY**: Use CSF (Component Story Format) only
2. **MANDATORY**: Use TypeScript for type safety
3. **REQUIRED**: Follow testing utilities from `storybook/test`

**Reference**: [SKILL-storybook.md](SKILL-storybook.md) for patterns, assertions, and metadata configuration.

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
