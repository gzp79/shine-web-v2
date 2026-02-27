# Mock Control API - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable Playwright E2E tests to dynamically add/remove MSW mock handlers via an HTTP API, with typed fixtures for ergonomic test authoring.

**Architecture:** Four layers — handler registry (types + factories), HTTP endpoint (POST add / DELETE remove+reset), Playwright fixture (typed `mock.add`/`mock.remove`/`mock.reset` with auto-reset), and default handlers (guest happy path on boot).

**Tech Stack:** MSW 2.x, SvelteKit server routes, Playwright fixtures, TypeScript

---

### Task 1: Create Handler Registry

**Files:**

- Create: `src/mocks/registry.ts`

**Step 1: Create the registry file with types and factories**

```typescript
// src/mocks/registry.ts
import type { RequestHandler } from 'msw';
import { defaultExternalLogin, defaultGuestLogin, tokenLogin } from './data/auth/mocks';
import { defaultProviders } from './data/providers/mocks';
import { defaultGuestUser, unauthorizedUser } from './data/users/mock';
import { withDelay, withIdentityDown } from './middleware';

export interface MockHandlers {
    defaultProviders: void;
    unauthorizedUser: void;
    defaultGuestUser: void;
    defaultGuestLogin: void;
    defaultExternalLogin: void;
    tokenLogin: { success: boolean };
    withIdentityDown: void;
    withDelay: { ms: number };
}

type HandlerFactory<K extends keyof MockHandlers> = MockHandlers[K] extends void
    ? () => RequestHandler
    : (params: MockHandlers[K]) => RequestHandler;

export const registry: { [K in keyof MockHandlers]: HandlerFactory<K> } = {
    defaultProviders: () => defaultProviders,
    unauthorizedUser: () => unauthorizedUser,
    defaultGuestUser: () => defaultGuestUser,
    defaultGuestLogin: () => defaultGuestLogin,
    defaultExternalLogin: () => defaultExternalLogin,
    tokenLogin: (params) => tokenLogin(params.success),
    withIdentityDown: () => withIdentityDown,
    withDelay: (params) => withDelay(params.ms)
};
```

**Step 2: Verify it compiles**

Run: `pnpm exec tsc --noEmit src/mocks/registry.ts` (or just rely on IDE type-checking)

**Step 3: Commit**

```bash
git add src/mocks/registry.ts
git commit -m "feat: add typed MSW handler registry"
```

---

### Task 2: Switch Server Defaults to Guest Happy Path

**Files:**

- Modify: `src/mocks/server.ts`

**Step 1: Change default handlers to `mockForGuestUser` and export override state**

Replace the full content of `src/mocks/server.ts` with:

```typescript
import type { RequestHandler } from 'msw';
import { setupServer } from 'msw/node';
import { defaultExternalLogin, defaultGuestLogin, tokenLogin } from './data/auth/mocks';
import { defaultProviders } from './data/providers/mocks';
import { defaultGuestUser, unauthorizedUser } from './data/users/mock';
import { withDelay, withLog } from './middleware';

export const mockForLoginPage: Array<RequestHandler> = [
    defaultProviders,
    unauthorizedUser,
    defaultGuestLogin,
    tokenLogin(false),
    defaultExternalLogin
];

export const mockForGuestUser: Array<RequestHandler> = [
    defaultProviders,
    defaultGuestUser,
    defaultGuestLogin,
    tokenLogin(true),
    defaultExternalLogin
];

export const server = setupServer(withLog, withDelay(5000), ...mockForGuestUser);

// --- Mock control API state ---
// Tracks overrides added via the /api/__mock endpoint.
// MSW's server.use() prepends handlers, server.resetHandlers() removes all runtime handlers.
const activeOverrides = new Map<string, RequestHandler>();

export function addOverride(name: string, handler: RequestHandler): void {
    activeOverrides.set(name, handler);
    server.use(handler);
}

export function removeOverride(name: string): void {
    activeOverrides.delete(name);
    server.resetHandlers();
    if (activeOverrides.size > 0) {
        server.use(...activeOverrides.values());
    }
}

export function resetOverrides(): void {
    activeOverrides.clear();
    server.resetHandlers();
}
```

**Step 2: Verify the dev server still starts with mock config**

Run: `pnpm run env:mock && pnpm run build`
Expected: Builds without errors. Server would boot with guest user defaults.

**Step 3: Commit**

```bash
git add src/mocks/server.ts
git commit -m "feat: switch MSW defaults to guest happy path, add override management"
```

---

### Task 3: Create Mock Control API Endpoint

**Files:**

- Create: `src/routes/api/__mock/+server.ts`

**Step 1: Create the endpoint**

```typescript
// src/routes/api/__mock/+server.ts
import { config } from '@config';
import { registry } from '@mocks/registry';
import { addOverride, removeOverride, resetOverrides } from '@mocks/server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    if (config.environment === 'prod') {
        return new Response(null, { status: 404 });
    }

    const { handler, params } = await request.json();
    const factory = registry[handler as keyof typeof registry];
    if (!factory) {
        return new Response(JSON.stringify({ error: `Unknown handler: ${handler}` }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const mswHandler = (factory as Function)(params);
    addOverride(handler, mswHandler);

    return new Response(JSON.stringify({ ok: true, handler }), {
        headers: { 'Content-Type': 'application/json' }
    });
};

export const DELETE: RequestHandler = async ({ request }) => {
    if (config.environment === 'prod') {
        return new Response(null, { status: 404 });
    }

    const text = await request.text();
    if (text) {
        const { handler } = JSON.parse(text);
        removeOverride(handler);
        return new Response(JSON.stringify({ ok: true, removed: handler }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    resetOverrides();
    return new Response(JSON.stringify({ ok: true, reset: true }), {
        headers: { 'Content-Type': 'application/json' }
    });
};
```

Note: The single `(factory as Function)` cast is the only cast in the system — it bridges the typed registry (compile-time safe at call sites) to the dynamic HTTP dispatch. This is acceptable for test-only code.

**Step 2: Verify endpoint is reachable**

Run: `pnpm run env:mock && pnpm run build`
Expected: Builds without errors, route `api/__mock` is included.

**Step 3: Commit**

```bash
git add src/routes/api/__mock/+server.ts
git commit -m "feat: add mock control HTTP endpoint (POST add, DELETE remove/reset)"
```

---

### Task 4: Add Build-Time Route Exclusion for Prod

**Files:**

- Modify: `vite.config.ts`

**Step 1: Add a Vite plugin to exclude `__mock` routes in prod**

In `vite.config.ts`, add a plugin function before the `export default defineConfig(...)` block:

```typescript
import type { Plugin } from 'vite';

function excludeMockRoutes(): Plugin {
    return {
        name: 'exclude-mock-routes',
        resolveId(id) {
            if (config.environment === 'prod' && id.includes('__mock')) {
                return '\0empty-mock';
            }
        },
        load(id) {
            if (id === '\0empty-mock') {
                return '';
            }
        }
    };
}
```

Then add `excludeMockRoutes()` to the plugins array:

```typescript
plugins: [
    excludeMockRoutes(),
    tailwindcss(),
    sveltekit(),
    viteStaticCopy({ ... })
],
```

**Step 2: Verify prod build excludes the route**

Run: `pnpm run env:prod && pnpm run build`
Expected: Builds without errors. The `__mock` route should not appear in the build output.

Run: `pnpm run env:mock && pnpm run build`
Expected: Builds without errors. The `__mock` route is included.

**Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "feat: exclude __mock routes from prod builds via Vite plugin"
```

---

### Task 5: Create Playwright Fixture

**Files:**

- Create: `tests/e2e/fixtures/mock.ts`

**Step 1: Create the fixtures directory and mock fixture**

```typescript
// tests/e2e/fixtures/mock.ts
import { test as base } from '@playwright/test';
import type { MockHandlers } from '../../../src/mocks/registry';

class MockFixture {
    constructor(private baseURL: string) {}

    async add<K extends keyof MockHandlers>(
        name: K,
        ...params: MockHandlers[K] extends void ? [] : [MockHandlers[K]]
    ): Promise<void> {
        const response = await fetch(`${this.baseURL}/api/__mock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ handler: name, params: params[0] })
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Mock add '${name}' failed: ${error}`);
        }
    }

    async remove(name: keyof MockHandlers): Promise<void> {
        const response = await fetch(`${this.baseURL}/api/__mock`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ handler: name })
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Mock remove '${name}' failed: ${error}`);
        }
    }

    async reset(): Promise<void> {
        const response = await fetch(`${this.baseURL}/api/__mock`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Mock reset failed: ${error}`);
        }
    }
}

export { expect } from '@playwright/test';

export const test = base.extend<{ mock: MockFixture }>({
    mock: async ({ baseURL }, use) => {
        const fixture = new MockFixture(baseURL!);
        await use(fixture);
        await fixture.reset();
    }
});
```

**Step 2: Verify types resolve**

Run: `pnpm exec tsc --noEmit tests/e2e/fixtures/mock.ts` or check IDE for errors.
Expected: No type errors. `MockHandlers` interface is accessible.

**Step 3: Commit**

```bash
git add tests/e2e/fixtures/mock.ts
git commit -m "feat: add Playwright mock fixture with typed add/remove/reset"
```

---

### Task 6: Create Sample Login Token-Flow Test

**Files:**

- Create: `tests/e2e/login/token-flow.test.ts`

**Step 1: Create the login test directory and test file**

```typescript
// tests/e2e/login/token-flow.test.ts
import { expect, test } from '../fixtures/mock';

test('non-interactive token flow fails and redirects to prompt login', async ({ page, mock }) => {
    // Override defaults: user not authenticated, token login fails
    await mock.add('unauthorizedUser');
    await mock.add('tokenLogin', { success: false });

    // Visit login without prompt param → triggers non-interactive token flow
    await page.goto('/login?returnUrl=/dashboard');

    // Token flow fails → server redirects back with prompt=true query param
    await page.waitForURL('**/login**');
    const url = new URL(page.url());
    expect(url.searchParams.get('prompt')).toBe('true');
});
```

**Step 2: Commit**

```bash
git add tests/e2e/login/token-flow.test.ts
git commit -m "feat: add sample Playwright test for token login flow"
```

---

### Task 7: End-to-End Verification

**Step 1: Set up mock environment**

Run: `pnpm run env:mock`

**Step 2: Run the sample test**

Run: `pnpm exec playwright test tests/e2e/login/token-flow.test.ts --headed`
Expected: Test passes. The login page loads, token flow fails (mock returns redirect to errorUrl), page ends up at `/login?prompt=true&returnUrl=/dashboard`.

**Step 3: Verify auto-reset works**

After the test completes, the fixture calls `mock.reset()`. Verify by running a second test that relies on defaults (guest user authenticated) without explicit mock setup.

**Step 4: Verify prod guard**

Run: `pnpm run env:prod && pnpm run build`
Expected: Builds without errors. The `__mock` endpoint is excluded from the build.

**Step 5: Final commit if any fixes were needed**

```bash
git commit -m "fix: adjustments from e2e verification"
```

---

## File Summary

| File                                 | Action | Description                                                                        |
| ------------------------------------ | ------ | ---------------------------------------------------------------------------------- |
| `src/mocks/registry.ts`              | Create | `MockHandlers` type map + typed handler factory registry                           |
| `src/mocks/server.ts`                | Modify | Default to `mockForGuestUser`, add `addOverride`/`removeOverride`/`resetOverrides` |
| `src/routes/api/__mock/+server.ts`   | Create | HTTP endpoint: POST=add, DELETE=remove/reset, prod guard                           |
| `vite.config.ts`                     | Modify | Vite plugin to exclude `__mock` routes in prod builds                              |
| `tests/e2e/fixtures/mock.ts`         | Create | `MockFixture` class + extended Playwright `test` with auto-reset                   |
| `tests/e2e/login/token-flow.test.ts` | Create | Sample test: token flow → `prompt=true`                                            |
