# Mock Control API - Design

**Goal:** Enable Playwright E2E tests to dynamically add/remove MSW mock handlers via an HTTP API, with typed fixtures for ergonomic test authoring.

**Tech Stack:** MSW 2.x, SvelteKit server routes, Playwright fixtures, TypeScript

---

## Architecture

Four layers, each with a single responsibility:

```
┌─────────────────────────────────────────────────────────┐
│  Playwright Test                                        │
│  test('...', async ({ mock }) => {                      │
│      await mock.add('unauthorizedUser');                │
│      await mock.add('tokenLogin', { success: false });  │
│  });                                                    │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP (fetch)
┌──────────────────────▼──────────────────────────────────┐
│  SvelteKit Endpoint: /api/__mock                        │
│  POST = add handler, DELETE = remove/reset              │
└──────────────────────┬──────────────────────────────────┘
                       │ imports
┌──────────────────────▼──────────────────────────────────┐
│  Override Manager (server.ts)                           │
│  addOverride / removeOverride / resetOverrides          │
│  Wraps MSW's server.use() / server.resetHandlers()      │
└──────────────────────┬──────────────────────────────────┘
                       │ looks up
┌──────────────────────▼──────────────────────────────────┐
│  Handler Registry (registry.ts)                         │
│  MockHandlers type map → handler factories              │
└─────────────────────────────────────────────────────────┘
```

---

## Layer 1: Handler Registry

**File:** `src/mocks/registry.ts`

A single source of truth mapping handler names to their MSW factory functions. The `MockHandlers` interface defines every available handler and its parameter type (`void` for no params, or a typed object).

```typescript
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

export const registry: { [K in keyof MockHandlers]: HandlerFactory<K> } = { ... };
```

**Design decisions:**

- The `MockHandlers` interface is the contract shared between the registry, the HTTP endpoint, and the Playwright fixture — it's the only type that crosses layer boundaries.
- Adding a new mock handler means: create the MSW handler, add a key to `MockHandlers`, add a factory to `registry`. Type errors propagate to all call sites.

---

## Layer 2: Override Manager

**File:** `src/mocks/server.ts`

Manages MSW server state. Tracks active overrides by name and bridges to MSW's `server.use()` / `server.resetHandlers()`.

**Default handlers:** The server boots with the **guest happy path** (`mockForGuestUser`) — authenticated guest user with providers loaded. Tests that need different state override via the API.

**Interface:**

- `addOverride(name, handler)` — prepend handler via `server.use()`, track by name
- `removeOverride(name)` — remove by name, reset MSW, re-apply remaining overrides
- `resetOverrides()` — clear all overrides, reset MSW to defaults

**Why track by name:** MSW has no built-in way to remove a single runtime handler. The name-keyed map lets us surgically remove one override without losing others. On remove, we reset all runtime handlers and re-apply the remaining overrides.

**Why guest as default:** Most E2E tests exercise features behind authentication. Starting authenticated reduces boilerplate — tests only need overrides for the specific behavior they're testing.

---

## Layer 3: HTTP Endpoint

**File:** `src/routes/api/__mock/+server.ts`

SvelteKit server route exposing two methods:

| Method   | Body                   | Action                                          |
| -------- | ---------------------- | ----------------------------------------------- |
| `POST`   | `{ handler, params? }` | Look up factory in registry, call `addOverride` |
| `DELETE` | `{ handler }`          | Call `removeOverride(handler)`                  |
| `DELETE` | _(empty body)_         | Call `resetOverrides()`                         |

**Safety:**

- Returns 404 in production (`config.environment === 'prod'`)
- Returns 400 for unknown handler names
- The single `(factory as Function)` cast bridges the typed registry to dynamic HTTP dispatch — acceptable for test-only code

**Production exclusion:** A shared Vite plugin (`excludeTestInfraRoutes`) prevents both `__mock` and `__test` routes from production builds. See [component testing infrastructure design](./2026-02-27-component-testing-infrastructure-design.md#production-exclusion) for the unified plugin. The runtime guard is defense-in-depth.

---

## Layer 4: Playwright Fixture

**File:** `tests/e2e/fixtures/mock.ts`

A Playwright fixture (`mock`) that provides typed access to the mock control API. Tests import `{ test, expect }` from the fixture instead of from `@playwright/test`.

**Interface:**

```typescript
class MockFixture {
    async add<K extends keyof MockHandlers>(
        name: K,
        ...params: MockHandlers[K] extends void ? [] : [MockHandlers[K]]
    ): Promise<void>;

    async remove(name: keyof MockHandlers): Promise<void>;

    async reset(): Promise<void>;
}
```

**Key behaviors:**

- `add()` uses conditional rest params — `mock.add('unauthorizedUser')` has no second arg, `mock.add('tokenLogin', { success: false })` requires one. TypeScript enforces this at compile time.
- **Auto-reset:** The fixture calls `mock.reset()` in its teardown. Each test starts with a clean slate (the server's default guest handlers).
- Communication is plain `fetch()` against `baseURL/api/__mock`.

**Usage example:**

```typescript
import { expect, test } from '../fixtures/mock';

test('token flow fails → redirects to prompt login', async ({ page, mock }) => {
    await mock.add('unauthorizedUser');
    await mock.add('tokenLogin', { success: false });

    await page.goto('/login?returnUrl=/dashboard');
    await page.waitForURL('**/login**');

    const url = new URL(page.url());
    expect(url.searchParams.get('prompt')).toBe('true');
});
```

---

## File Summary

| File                               | Action | Description                                                                        |
| ---------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| `src/mocks/registry.ts`            | Create | `MockHandlers` type map + typed handler factory registry                           |
| `src/mocks/server.ts`              | Modify | Default to `mockForGuestUser`, add `addOverride`/`removeOverride`/`resetOverrides` |
| `src/routes/api/__mock/+server.ts` | Create | HTTP endpoint: POST=add, DELETE=remove/reset, prod guard                           |
| `vite.config.ts`                   | Modify | Vite plugin to exclude `__mock` routes in prod builds                              |
| `tests/e2e/fixtures/mock.ts`       | Create | `MockFixture` class + extended Playwright `test` with auto-reset                   |
