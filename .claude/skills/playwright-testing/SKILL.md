---
name: playwright-testing
description: Use for writing, running, or debugging Playwright browser tests — both component tests (tests/component/) and e2e tests (tests/e2e/) — covering API integration, loading/error state transitions, error recovery and retry flows, and multi-page user journeys. Also use when a browser test is flaky on a transient state (spinner, disabled button, in-flight message) or hangs against the mocked server. For isolated component logic without a browser, use vitest-testing.
---

# Playwright Testing (Layer 2 & 3)

**Playwright + browser** for API integration, state transitions, full user flows
**Location:** `tests/**/*.test.ts` | **Run:** `pnpm test:component` (component) · `pnpm test:e2e` (e2e)

## Environment: must be `mock` first

Before running or writing tests, the project must be on the mock environment:

```bash
pnpm run env:mock   # MSW mocks — the environment tests run against
```

This is essential, not optional: the test fixtures and handlers assume MSW is
active. Verify by reading `src/generated/config.ts` (`environment: 'mock'`); if
it's anything else, run `env:mock` before proceeding. The other environments
(`env:local`, `env:dev`, `env:prod` — see CLAUDE.md) point at real backends and
are only for Layer 3 tests against live data.

## The server is mocked, deterministic, and single-worker

Mocked responses resolve almost instantly, so transient UI (spinners, disabled
buttons, "Sending…" text) can come and go before an assertion ever polls the
DOM. Two consequences run through this whole guide:

- **Control timing with a gate, never with delays or sleeps.** To observe an
  in-flight state, hold the request open with `RequestGate` (see below). Never
  reach for `withDelay`, `waitForTimeout`, or an inflated timeout to "give the
  UI a chance" — that trades a race for a slow, still-flaky test.
- **Fail fast.** Because responses are immediate, a test that hangs is a test
  that's actually broken — there is no slow backend to wait on. Keep timeouts
  short so real failures surface in seconds instead of after a 30s default.

## Layer 2: With MSW Mocks (Common)

**Env:** `pnpm run env:mock`
**Test:** API integration, state transitions (loading → success/error), error recovery, retry flows
**Not:** Data mutations (avoid parallel logic - mocks don't mutate)

## Layer 3: Real Backend (Sparingly)

**Env:** `pnpm run env:local` or `env:dev`
**Test:** Actual data mutations, full system integration
**Use:** Slow, requires real services

## Directory: tests/component/ vs tests/e2e/

Same stack, different scope. Choose layer by fixture usage, not directory.

- `component/` - Component-focused (dialogs, forms, cards)
- `e2e/` - Multi-page flows (login → action → result)

## Running Tests

### Prerequisites

1. **Check environment is mock** — read `src/generated/config.ts` and verify `environment: 'mock'`. If not, ask the user to run `pnpm run env:mock`.
2. **Dev server must be running** — component and E2E tests need `pnpm run dev` in the background.

### Commands

| Command                | Scope                                                      |
| ---------------------- | ---------------------------------------------------------- |
| `pnpm test`            | All tests (unit → component → e2e, stops on first failure) |
| `pnpm test:unit --run` | Vitest unit tests (single run)                             |
| `pnpm test:unit`       | Vitest unit tests (watch mode)                             |
| `pnpm test:component`  | Playwright — `tests/component/`                            |
| `pnpm test:e2e`        | Playwright — `tests/e2e/`                                  |

### Filtering

```bash
# Run specific file
pnpm test:component -- tests/component/account/activetokens.test.ts

# Filter by test name
pnpm test:component -- --grep "revoke token"
```

### Troubleshooting

If tests fail unexpectedly, check:

- Environment is `mock` in `src/generated/config.ts`
- Dev server is running (`pnpm run dev`)
- No stale dev server from a previous session (UI changes not reflecting, mock handlers not taking effect)

## Mock Fixture

Import `test` and `expect` from the fixture, not from `@playwright/test`:

```typescript
import { expect, test } from '../fixtures/mock';
```

The `mock` fixture is auto-injected and **auto-resets after each test**.

### Available Handlers

See `MockHandlers` interface in `src/mocks/registry.ts` for the full list of handler names and their typed params.

### API

```typescript
await mock.add('handlerName'); // void params
await mock.add('withDelay', { ms: 2000 }); // typed params
await mock.remove('handlerName'); // remove specific override
await mock.reset(); // reset to defaults (automatic in afterEach)
```

### Defaults (pre-loaded on server boot)

Server starts with `mockForGuestUser` — authenticated guest with account data:

- `defaultProviders`, `defaultGuestUser`, `defaultActiveSessions`, `defaultActiveTokens`, `defaultLinkedIdentities`, `revokeTokenHandler`, `unlinkIdentityHandler`, `startEmailConfirmationHandler`, `startEmailChangeHandler`

Auth flows (login, logout, link) navigate directly to the identity server — no MSW mocks needed. Use Playwright route interception instead (see Auth Interceptors below).

Tests only need to override what they're testing.

## Adding New Handlers

1. Create handler in `src/mocks/data/<domain>/mocks.ts`
2. Add entry to `MockHandlers` interface in `src/mocks/registry.ts`
3. Add factory to `registry` object in same file

## Structuring Tests with `test.step()`

Use `test.step()` to organize multi-phase tests. Each step groups related assertions and actions, making test reports clearer and failures easier to locate.

```typescript
test('revoke token: confirmation dialog and loading states', async ({ page }) => {
    await page.goto('/__test/account/activetokens');
    await expect(page.getByText('hash-token-1')).toBeVisible();

    const revokeButton = page.getByText('Revoke').first();

    await test.step('open confirmation dialog', async () => {
        await revokeButton.click();
        await expect(page.getByRole('heading', { name: 'Revoke Token' }).first()).toBeVisible();
        await expect(page.getByText('Are you sure you want to revoke this token?')).toBeVisible();
    });

    await test.step('confirm revoke and observe loading', async () => {
        const gate = await RequestGate.forRemote(page, 'revokeToken');

        const confirmButton = page.getByLabel('Revoke Token').getByRole('button', { name: 'Revoke' });
        await confirmButton.click();

        await gate.hold(); // request is now in flight and held open
        await expect(revokeButton).toBeDisabled();

        gate.release(); // let it complete
        await expect(revokeButton).toBeEnabled();

        await gate.dispose();
    });
});
```

The gate is what makes the loading assertion reliable: without it, the mocked
`revokeToken` resolves so fast that the button flips back to enabled before
`toBeDisabled()` can observe it. See **Observing in-flight states** below for
the full rationale and API.

**When to use steps:**

- Tests with distinct phases (setup → action → verify → recover)
- Error recovery flows (trigger error → see error → fix → see recovery)
- Dialog flows (open → interact → close)

**When NOT needed:** Simple tests with a single phase (load page, check content).

## Auth Interceptors (`tests/helpers/auth-intercept.ts`)

Auth flows (login, logout, link provider) navigate the browser directly to the identity server. MSW can't intercept browser navigations — only fetch/XHR. Use Playwright's `page.route()` via these helpers:

```typescript
import {
    interceptIdentityAuth,
    interceptIdentityAuthWithError,
    interceptIdentityAuthWithRedirect
} from '../../helpers/auth-intercept';
```

### `interceptIdentityAuthWithRedirect(page, paramName?)`

Intercepts identity server navigations and redirects to the URL in the given query param (default: `'redirectUrl'`).

```typescript
// Simulate successful logout → redirects to /public/bye
test('logout redirects to bye page', async ({ page }) => {
    await interceptIdentityAuthWithRedirect(page);
    await page.goto('/__test/account/userinfo');
    await page.getByRole('link', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/public\/bye/);
});

// Use a different param name (e.g., errorUrl for token login failures)
await interceptIdentityAuthWithRedirect(page, 'errorUrl');
```

### `interceptIdentityAuthWithError(page, status?)`

Simulates identity server being down (default: 503).

```typescript
test('logout href points to identity server when down', async ({ page }) => {
    await interceptIdentityAuthWithError(page);
    await page.goto('/__test/account/userinfo');
    const href = await page.getByRole('link', { name: 'Logout' }).getAttribute('href');
    expect(href).toContain('/identity/auth/logout');
});
```

### `interceptIdentityAuth(page, handler)`

Full control — custom handler receives the parsed URL, returns `{ redirect }`, `{ status, body? }`, or `undefined` (aborts).

```typescript
await interceptIdentityAuth(page, (url) => {
    if (url.pathname.includes('/auth/logout')) {
        return { redirect: url.searchParams.get('redirectUrl') || '/public/bye' };
    }
});
```

## Observing in-flight states (`tests/helpers/request-gate.ts`)

When a test needs to assert on a transient state — a spinner, a disabled
button, a "Sending…" message — it cannot rely on timing. The mock resolves
immediately, so the state may be gone before Playwright's first poll. Adding a
`withDelay` or a `waitForTimeout` to "slow things down" only swaps a fast race
for a slow one; the assertion still depends on winning a timing window.

`RequestGate` removes the race by holding the request open at the browser layer
until you explicitly release it, so the in-flight state stays put for as long as
you need:

```typescript
import { RequestGate } from '../../helpers/request-gate';

const gate = await RequestGate.forRemote(page, 'startEmailChange');

await page.getByText('Update').click();

await gate.hold(); // request is in flight and held open
await expect(page.getByText('Sending change request...')).toBeVisible();

gate.release(); // let it reach the (mocked) server and complete
await expect(page.getByText('Please check your email...')).toBeVisible();

await gate.dispose();
```

See the JSDoc in `tests/helpers/request-gate.ts` for the full API
(`create`/`forRemote`, `hold`, `release`, `dispose`).

## Test Patterns

### Layer 2: With Mock Fixture

```typescript
import { expect, test } from '../../fixtures/mock';

test('error recovery flow', async ({ page, mock }) => {
    await mock.add('withIdentityDown');

    await test.step('navigate and see error', async () => {
        await page.goto('/__test/account/activetokens');
        await expect(page.getByText('Retry').first()).toBeVisible();
    });

    await test.step('recover after retry', async () => {
        await mock.remove('withIdentityDown');
        await page.getByText('Retry').first().click();
        await expect(page.getByText('hash-token-1')).toBeVisible();
    });
});
```

### Layer 2: With Mock Fixture + Auth Interceptors

Combine MSW mocks (for API data) with route interception (for auth navigations):

```typescript
import { expect, test } from '../../fixtures/mock';
import { interceptIdentityAuthWithRedirect } from '../../helpers/auth-intercept';

test('logout button click redirects to bye page', async ({ page }) => {
    await interceptIdentityAuthWithRedirect(page);
    await page.goto('/__test/account/userinfo');
    await expect(page.getByText('Freshman')).toBeVisible();

    await page.getByRole('link', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/public\/bye/);
});
```

### Layer 3: Without Mocks

```typescript
import { expect, test } from '@playwright/test';

test('data mutation', async ({ page }) => {
    await page.goto('/account/tokens');
    const hash = await page.getByText(/hash-/).first().textContent();

    await page.getByText('Revoke').first().click();
    await page.getByRole('button', { name: 'Revoke' }).click();
    await expect(page.getByText(hash!)).not.toBeVisible(); // Real deletion
});
```

## File Structure

```
tests/
├── fixtures/
│   └── mock.ts              # MockFixture + extended test
├── helpers/
│   ├── auth-intercept.ts    # Playwright route interception for identity server
│   ├── request-gate.ts      # Hold requests open to observe in-flight states
│   └── interactions.ts      # Reusable UI interaction helpers (e.g., clickComboAction)
├── component/               # Component-focused tests
│   └── <feature>/
│       └── *.test.ts
└── e2e/                     # Multi-page flow tests
    └── <feature>/
        └── *.test.ts
```

## Philosophy: Avoid Parallel Logic

**Don't make Layer 2 mocks stateful** (e.g., removing tokens on DELETE) = reimplementing business logic in test layer.

**Layer 2 verifies:** API calls, state transitions (loading → success/error), error handling
**Layer 3 verifies:** Real data mutations with backend

## Gotchas

- **MSW vs `page.route()`:** MSW intercepts fetch/XHR (API calls). `page.route()` intercepts browser navigations. Auth flows (login, logout, link) are navigations → use auth interceptors, not MSW.
- **Parallel logic:** Don't make Layer 2 mocks stateful. Test state transitions, not data mutations.
- **Self-signed certs:** Fixture uses Playwright's `request` (not Node `fetch`) — respects `ignoreHTTPSErrors`
- **Don't slow mocks to observe loading:** `withDelay` is for testing genuine slow-network UX (e.g. that a loader appears at all), not for catching a transient state — use `RequestGate` for that. A delay just makes the suite slow while leaving the assertion racy.
- **waitForURL:** Use regex patterns (e.g. `/prompt=true/`) to avoid matching the initial URL before redirects happen
- **Prod guard:** `/api/__mock` returns 404 in prod and is excluded from prod builds via Vite plugin
