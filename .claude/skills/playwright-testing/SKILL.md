---
name: playwright-testing
description: Use when testing API integration, state transitions, error recovery, or full user journeys with browser. For isolated component logic, use vitest-testing.
---

# Playwright Testing (Layer 2 & 3)

**Playwright + browser** for API integration, state transitions, full user flows
**Location:** `tests/**/*.test.ts` | **Run:** `pnpm test:e2e`

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

## Setup

### Dev Server Management

**Common issue:** Vite dev server from previous session still running → tests run against stale code.

**Before running tests:**

1. **Check if port is in use:**

    ```bash
    # Windows (bash shell in Claude Code)
    netstat -ano | grep :5173
    ```

2. **Kill stuck dev server if found:**

    ```bash
    # Windows: Find PID from netstat output, then:
    taskkill //PID <pid> //F

    # Alternative: Kill by port (requires admin/elevated prompt usually)
    # If above fails, kill all node processes:
    taskkill //IM node.exe //F
    ```

3. **Verify environment before tests:**

    ```bash
    # Ensure correct mock environment is set
    pnpm run env:mock

    # Start dev server fresh
    pnpm run dev
    ```

**Red flags that indicate stale server:**

- Tests fail immediately with connection errors
- Tests pass locally but fail in CI (different ports)
- UI changes don't reflect in test runs
- Mock handlers don't take effect

**Best practice:** Always kill existing dev processes before starting a new test session. When debugging test failures, check process list first.

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
await mock.add('tokenLogin', { success: false }); // typed params
await mock.remove('handlerName'); // remove specific override
await mock.reset(); // reset to defaults (automatic in afterEach)
```

### Defaults (pre-loaded on server boot)

Server starts with `mockForGuestUser` — authenticated guest, token login succeeds:

- `defaultProviders`, `defaultGuestUser`, `defaultGuestLogin`, `tokenLogin(true)`, `defaultExternalLogin`

Tests only need to override what they're testing.

## Adding New Handlers

1. Create handler in `src/mocks/data/<domain>/mocks.ts`
2. Add entry to `MockHandlers` interface in `src/mocks/registry.ts`
3. Add factory to `registry` object in same file

## Test Patterns

### Layer 2: With Mock Fixture

```typescript
import { expect, test } from '../../fixtures/mock';

test('error recovery flow', async ({ page, mock }) => {
    await mock.add('identityServiceDown');
    await page.goto('/account/tokens');
    await expect(page.getByText('Retry').first()).toBeVisible();

    await mock.remove('identityServiceDown');
    await page.getByText('Retry').first().click();
    await expect(page.getByText('hash-token-1')).toBeVisible();
    // Mock doesn't mutate data - testing state transitions only
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
tests/e2e/
├── fixtures/
│   └── mock.ts            # MockFixture + extended test
└── <feature>/
    └── <scenario>.test.ts
```

## Philosophy: Avoid Parallel Logic

**Don't make Layer 2 mocks stateful** (e.g., removing tokens on DELETE) = reimplementing business logic in test layer.

**Layer 2 verifies:** API calls, state transitions (loading → success/error), error handling
**Layer 3 verifies:** Real data mutations with backend

## Gotchas

- **Parallel logic:** Don't make Layer 2 mocks stateful. Test state transitions, not data mutations.
- **Self-signed certs:** Fixture uses Playwright's `request` (not Node `fetch`) — respects `ignoreHTTPSErrors`
- **MSW delay:** Default `withDelay(5000)` slows every mocked request by 5s. Tests involving multiple API calls can take 15-20s
- **waitForURL:** Use regex patterns (e.g. `/prompt=true/`) to avoid matching the initial URL before redirects happen
- **Prod guard:** `/api/__mock` returns 404 in prod and is excluded from prod builds via Vite plugin
