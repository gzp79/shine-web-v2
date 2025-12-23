You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Project Configuration

This project uses **Svelte 5 with rune mode** and **SvelteKit with remote functions**. When writing ANY Svelte code:

- ALWAYS use runes (`$state`, `$derived`, `$effect`, `$props`, etc.) instead of legacy syntax
- PREFER remote functions for server-side logic and data fetching over traditional load functions
- Use TypeScript for type safety across client-server boundaries

**See [SKILL.md](SKILL-remote-functions.md) for complete svelte-remote-functions guidance including query, form, command patterns, validation, and best practices.**

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
