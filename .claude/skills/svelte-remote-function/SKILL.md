---
name: svelte-remote-functions
description: Guide for SvelteKit 3 Remote Functions. Use this skill by default for all SvelteKit projects doing type-safe client-server communication with query (data fetching), form (progressive enhancement), command (imperative actions), or data invalidation/refresh patterns.
---

# SvelteKit Remote Functions (SvelteKit 3)

Type-safe client-server communication for SvelteKit applications. Still **experimental** in Kit 3:
enabled in `vite.config.ts` via `sveltekit({ experimental: { remoteFunctions: true }, compilerOptions: { experimental: { async: true } } })`.

For anything not covered here, fetch `kit/remote-functions` via the Svelte MCP — the API moves fast.

## When to Use This Skill

Use this skill by default for all SvelteKit projects. It covers:

- Type-safe data fetching with `query`, `query.batch`, `query.live`
- Forms with progressive enhancement using `form`
- Imperative server actions with `command`
- Single-flight refresh and optimistic updates

## File Structure

A remote module is any file with a `remote` filename segment: `data.remote.ts`, `remote.ts`,
`data.remote.test.ts`. It can live anywhere in `src` **except** inside a `server/` directory
(server-only, cannot be imported by the client). A schema cannot be exported from a remote module —
put shared schemas in a normal module.

## Core Concepts

1. **query** - Read dynamic data (most common)
2. **query.batch** - Batch calls in the same macrotask (N+1 prevention)
3. **query.live** - Async generator, streams real-time values; has `connected`/`reconnect()`, no `refresh()`
4. **form** - Write data via forms with progressive enhancement
5. **command** - Write data imperatively from event handlers (cannot be called during render)
6. **prerender** - Static data, prerendered at build time

Arguments and return values are serialized with devalue (Date, Map, Set, plus `transport` hook types).

## Query

```typescript
// data.remote.ts
import { query } from '$app/server';
import { error } from '@sveltejs/kit';
import { z } from 'zod';

export const getPosts = query(async () => {
    return await db.getAllPosts();
});

export const getPost = query(z.string(), async (slug) => {
    const post = await db.getPost(slug);
    if (!post) error(404, 'Not found');
    return post;
});

// callback returns a lookup function `(input, index) => output`
export const getPostsBatch = query.batch(z.string(), async (slugs) => {
    const posts = await db.getPostsBySlug(slugs);
    const lookup = new Map(posts.map((p) => [p.slug, p]));
    return (slug) => lookup.get(slug);
});
```

```svelte
<script>
    import { getPosts } from './data.remote';
</script>

<!-- preferred: await, pending/error go to the nearest <svelte:boundary> -->
{#each await getPosts() as post (post.slug)}
    <div>{post.title}</div>
{/each}
```

Or with properties:

```svelte
<script>
    import { getPosts } from './data.remote';

    const posts = getPosts();
</script>

{#if posts.error}
    Error: {posts.error.message}
{:else if posts.loading}
    Loading...
{:else}
    {#each posts.current as post (post.slug)}
        <div>{post.title}</div>
    {/each}
{/if}
```

`error` is typed `App.Error | undefined` — it has already passed through `handleError`, so it has
`status`, `message` and any `App.Error` extras (not an `HttpError`, not the raw thrown value).

Queries are deduped by argument: `getPosts() === getPosts()` while in use. Object/Map/Set arguments
are key-sorted for the cache key.

## Form

Data arrives **already parsed and validated** as an object — no `FormData.get`. Inputs **must** use
`fields.<name>.as(type)`; a hand-written `<input name="...">` causes the submission to be rejected.

```typescript
// data.remote.ts
import { form } from '$app/server';
import { error, invalid, redirect } from '@sveltejs/kit';
import { z } from 'zod';

export const createPost = form(
    z.object({
        title: z.string().min(1),
        content: z.string().min(1)
    }),
    async ({ title, content }, issue) => {
        const user = await getUser();
        if (!user) error(401, 'Unauthorized');

        if (await db.slugTaken(title)) {
            invalid(issue.title('Title already used')); // field-level issue, throws
        }

        await db.insert(title, content);
        void getPosts().refresh(); // single-flight, see below
        redirect(303, `/blog/${slug(title)}`);
    }
);

// `_`-prefixed fields are never sent back to the client
export const register = form(z.object({ username: z.string().min(3), _password: z.string().min(8) }), async (data) => {
    /* ... */
});
```

```svelte
<form {...createPost}>
    {#each createPost.fields.title.issues() as issue}
        <p>{issue.message}</p>
    {/each}
    <input {...createPost.fields.title.as('text')} />
    <textarea {...createPost.fields.content.as('text')}></textarea>
    <button disabled={!!createPost.pending}>Publish</button>
</form>

{#if createPost.result}...{/if}
```

**Fields:**

- `.as(type, value?)` — second arg sets the rendered/reset value (edit forms, `for(id)` instances).
  `radio`/`submit`/`hidden` always need it; `radio`/`checkbox` options: `.as('checkbox', option, checked)`
- Nested objects/arrays: `fields.info.height.as('number')`, `fields.tags[0].as('text')`
- Numbers/booleans are coerced; unchecked checkboxes and empty selects are absent → schema
  default (`z.boolean().default(false)`, `z.array(...).default([])`)
- `file` inputs need `enctype="multipart/form-data"`
- `fields.x.issues()`, `fields.allIssues()` (`undefined` when valid), `fields.x.value()`,
  `fields.set({...})`, `form.validate({ includeUntouched })`
- Client-side check without a round trip: `{...createPost.preflight(schema)}`
- Multiple submit buttons: `{...form.fields.action.as('submit', 'login')}`
- Isolated instances in lists: `const f = deleteItem.for(item.id)` then `{...f}`

**enhance:**

```svelte
<form
    {...createPost.enhance(async (form) => {
        try {
            if (await form.submit()) {
                form.element.reset(); // enhance does not auto-reset
            }
        } catch (e) {
            showToast('Something went wrong');
        }
    })}
></form>
```

Errors thrown in a form handler render the nearest `+error.svelte`.

## Command

```typescript
// likes.remote.ts
import { command, query } from '$app/server';
import { z } from 'zod';

export const getLikes = query(z.string(), async (id) => db.getLikes(id));

export const addLike = command(z.string(), async (id) => {
    await db.incrementLikes(id);
    void getLikes(id).refresh(); // single-flight
});
```

```svelte
<button
    onclick={async () => {
        try {
            await addLike(item.id);
        } catch {
            showToast('Something went wrong');
        }
    }}
>
    Like ({await getLikes(item.id)})
</button>
```

`redirect()` is **not** allowed inside `command` — return `{ redirect: location }` and navigate on the
client.

## Single-flight Mutations

Default: `form` invalidates **all** queries and loads; `command` invalidates **nothing**. Prefer
refreshing exactly what changed, in the same response.

### Server-driven

Inside the handler, call `.refresh()`, `.set(value)` or (live) `.reconnect()` on the query instance.
Use `void` — the framework awaits it before sending the response. Any of these in a `form` handler
replaces the default invalidate-everything.

```typescript
void getPosts().refresh();
getPost(post.id).set(updated);
```

⚠️ Put these **before** any `return` — code after `return await ...` never runs.

### Client-requested

The client names the instances it wants refreshed (optionally with an optimistic override):

```typescript
await addLike(id).updates(getLikes(id).withOverride((n) => n + 1));
await submit().updates(getPosts, getPosts({ filter: 'mine' }));
```

The server must **accept** them with `requested(fn, limit)`; every requested entry must be
refreshed, set, reconnected or ignored, otherwise that query errors on the client:

```typescript
import { command, requested } from '$app/server';

export const addLike = command(z.string(), async (id) => {
    await db.incrementLikes(id);
    await requested(getLikes, 1).refreshAll(); // or loop: for (const { arg, query, ignore } of ...)
});
```

`limit` is required (client-controlled list → DoS risk). `.ignoreAll()` ignores the selected ones.

Overrides from `withOverride` apply immediately and are released when the mutation settles; if the
refresh did not happen, the old value comes back.

## Request Context

```typescript
import { getRequestEvent } from '$app/server';

const { cookies, locals, fetch } = getRequestEvent();
```

- Never take an `event` parameter — the second callback parameter is only `issue` (forms)
- Inside **any** `query` (incl. `batch`/`live`), reading `event.url`, `event.params` or
  `event.route` **throws** — pass needed values as arguments
- In `form`/`command`, `url`/`params`/`route` describe the calling page and are client-controlled —
  never use them for authorization
- Headers cannot be set; cookies only in `form`/`command`

## Validation Errors

Argument validation failures return a generic 400 and pass through `handleError` in
`hooks.server.ts` with `kind: 'validation'` and the `issues` (there is no `handleValidationError`):

```typescript
import type { HandleServerError } from '@sveltejs/kit/hooks';

export const handleError: HandleServerError = ({ kind, issues }) => {
    if (kind === 'validation') {
        logAPI.error('validation failed', issues);
        return { message: 'Invalid request' };
    }
};
```

Do not echo `issues` to the client. `'unchecked'` in place of a schema disables validation — avoid.

## Critical Syntax Rules

- ✅ No args: `query(async () => {})`
- ✅ With args: `query(z.schema(), async (arg) => {})`
- ❌ `query(async (arg) => {})` without a schema
- ❌ `query(z.schema(), async (arg, event) => {})` — use `getRequestEvent()`
- ❌ `<input name="title">` in a remote form — use `fields.title.as('text')`
- ❌ `data.get('title')` — the handler receives the parsed object
- ❌ `redirect()` inside `command`
- ❌ `json()` / `text()` helpers — use `Response.json()` / `new Response()`

## Best Practices

1. Prefer `query` over `prerender` for dynamic data
2. Prefer `form` over `command` for progressive enhancement
3. Use single-flight refresh instead of invalidating everything
4. Validate every argument with a Standard Schema (Zod here)
5. Pair `withOverride` with a server-side `requested(...)` or matching `.refresh()`
6. Use `query.batch` for per-item lookups in lists, `form.for(id)` for repeated forms
7. Prefix sensitive form fields with `_`
