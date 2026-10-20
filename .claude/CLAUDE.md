# Shine Web V2 - Project Rules

## 🚨 Critical Rules

1. **`pnpm` only** - Never use npm/yarn
2. **Svelte 5 runes only** - `$state`, `$derived`, `$effect`, `$props`
3. **Tailwind 4 + semantic colors** - `bg-primary` NOT `bg-blue-500`
4. **Async Svelte on** - `await` allowed in `<script>` and markup; pass `async: true` to `svelte-autofixer`

## Stack

- **Framework:** Svelte 5 (runes) + SvelteKit 3
- **Server:** Remote functions (`query`, `form`, `command`) — see the `svelte-remote-functions` skill
- **CSS:** Tailwind 4 (semantic tokens)
- **Testing:** Vitest (unit), Playwright (integration/E2E), Storybook 10 (visual tryout, plus
  optional visual tests where Vitest/Playwright cannot cover it)
- **Rendering:** CSR by default (`ssr = false` in root layout); individual pages can opt in with `export const ssr = true` in `+page.ts`

## Class Members

- **Private:** native `#field` / `#method()` (real runtime privacy, modern TS default)
- **Protected / inherited:** TS `protected` (no prefix) — `#` cannot be `protected` or overridden
- Do not use the legacy `_`-prefixed `private` convention in new code

## Contexts

Accessors come from `createContext<T>('XContext')` (`#lib/utils`); the name is the context type in
PascalCase and appears only in errors.

| Function                    | Does                                 |
| --------------------------- | ------------------------------------ |
| `provideXContext(options?)` | constructs the value and installs it |
| `setXContext(value)`        | installs a value the caller owns     |
| `getXContext()`             | reads; **throws** if absent          |
| `tryGetXContext()`          | reads; `undefined` if absent         |

- `options` configure construction — never pass the value itself, that is `setXContext`
- `provideXContext` delegates to `setXContext` when both exist
- `tryGet*` only where a missing provider is valid (`Field`, `InputGroup`, `ContainerRoot`)
- No `use*` prefix; for a lifetime-bound reference use `track` (`UserStore.track`)
- Install before any `await` — async Svelte throws `set_context_after_init` after init

## SvelteKit 3

Training data skews to Kit 2 — these are the v3 changes most likely to be gotten wrong. For any other
Kit API, fetch the docs via MCP first (`kit/migrating-to-sveltekit-3` is the full delta).

- **Config:** no `svelte.config.js` — options go to `sveltekit({...})` in `vite.config.ts`, top level
  (no `kit.` nesting)
- **Imports:** `#lib/...` (package.json `imports`), never `$lib`; `$app/env` not `$app/environment`;
  `$app/state` not `$app/stores`; `$app/env/{private,public}` not `$env/*`
- **Types:** `Handle`/`HandleServerError` from `@sveltejs/kit/hooks`; `RemoteQuery`/`RemoteCommand`/... from
  `$app/server`; `isHttpError`/`isRedirect` instead of `instanceof`
- **Navigation:** `refreshAll` not `invalidateAll`; `goto(url, { shallow, state })` not
  `pushState`/`replaceState`; `goto` options are `replace`, `refreshAll`, `reset: false` (was
  `keepFocus`+`noScroll`); `goto` rejects for non-route URLs — use `window.location` for external ones
- **Paths:** `resolve()`/`asset()` only (`base`/`assets`/`resolveRoute` removed); only route IDs start
  with `/` — `resolve('/(auth)/game')` ok, plain paths and assets have no leading slash
- **`page.url` is readonly** — copy with `new URL(page.url.href)` before mutating
- **Errors:** `error(status, message: string, extras?)`; `App.Error` always has `status`;
  `handleError` receives **every** error (`kind: 'unknown' | 'validation' | ...`), there is no
  `handleValidationError`; it may return `status`
- **Redirects:** external targets need `redirect(status, url, { external: true })`
- **Responses:** `Response.json(...)` / `new Response(text)` instead of `json()` / `text()`
- **Server-only:** any `server` filename segment or `server/` directory (outside `src/routes`)
- **Cookies:** `path` defaults to `'/'`; ASCII names only

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

Running the full local stack (backend services, assets, optional game client) is a multi-repo
setup — see `docs/local-dev.md` for hosts file, certificates, and per-service startup steps.

**Env flags:** import `IS_MOCK`, `IS_PROD`, `SKIP_CAPTCHA`, ... from `#lib/utils` — never read
`import.meta.env.VITE_*` directly. `vite build` inlines the defines as real booleans, but vitest
hands them back as the strings `'true'`/`'false'`, and `'false'` is truthy. Keep each flag a plain
`=== true || === 'true'` comparison: wrapping it in a helper call stops Vite folding it to a literal
and drags guarded `#mocks` imports into the bundle.

**Unit tests stay env-agnostic** — they must pass under any selected env. Never assert on
flag-derived values; stub env-gated module bodies instead (`vi.mock('#mocks/setup-client', () => ({}))`).

## Design docs

Feature docs live at `docs/<domain>/<feature>.md` — plain Markdown with Mermaid
diagrams. See the `sdp` skill for the full doc format contract and keeping
doc ↔ code in sync.

## Svelte AI tools

Official [sveltejs/ai-tools](https://github.com/sveltejs/ai-tools) plugin — install once per machine:
`/plugin marketplace add sveltejs/ai-tools`, then `/plugin install svelte`.

- **Agent `svelte:svelte-file-editor`** - delegate creating/editing `.svelte` / `.svelte.ts` files to it
- **Skill `svelte:svelte-core-bestpractices`** - load before writing or reviewing Svelte code
- **Skill `svelte:svelte-code-writer`** - CLI fallback (`npx @sveltejs/mcp ...`) when MCP is unavailable
- **MCP tools:**
    - `svelte-autofixer` - Run on ALL Svelte code before sending
    - `list-sections` / `get-documentation` - Fetch current Svelte 5 + SvelteKit 3 docs (prefer over memory)
    - `playground-link` - Generate playground (ask user first)

Project rules above (contexts, components, Tailwind tokens, `#lib`) take precedence over the generic
plugin guidance.
