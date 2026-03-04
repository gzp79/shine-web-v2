---
name: playwright-testing
description: Layer 2/3 - Playwright tests (tests/**/*.test.ts). Layer 2 uses MSW mocks (state transitions, error flows). Layer 3 uses real services (data mutations).
---

# Playwright Testing (Layer 2 & 3)

## Layer 2: Integration Tests (With Mocks)

**Purpose:** API integration, state transitions, error recovery
**Framework:** Playwright + MSW mock fixture
**Location:** `tests/component/**/*.test.ts`, `tests/e2e/**/*.test.ts` (with mocks)
**Run:** `pnpm test:e2e`
**Env:** `pnpm run env:mock`

**Test Scope:**
- ✅ API endpoints called correctly
- ✅ State transitions (loading → success/error)
- ✅ Error boundaries and retry flows
- ✅ User interactions across full pages
- ❌ NOT data mutations (avoid parallel logic)

**Why mocks don't mutate data:**
Avoids reimplementing business logic in test layer. Backend correctness tested by backend.

## Layer 3: True E2E Tests (Real Services)

**Purpose:** Full system integration with real backend
**Framework:** Playwright without mocks
**Location:** `tests/e2e/**/*.test.ts` (without mock fixture)
**Run:** `pnpm test:e2e` (with real backend running)
**Env:** `pnpm run env:local` or `env:dev`

**Test Scope:**
- ✅ Full user journeys end-to-end
- ✅ Actual data mutations
- ✅ Real backend behavior
- Use sparingly (slow, requires real services)

## Directory Convention

Both directories use same Playwright + mock fixture. Choose layer by fixture usage, not directory.

**`tests/component/`** - Component-focused flows
- Single component/card behaviors (dialogs, forms, cards)
- Layer 2 (mocked) - most common

**`tests/e2e/`** - Full user journeys
- Multi-page flows (login → action → result)
- Layer 2 (mocked) - common
- Layer 3 (real backend) - sparingly

## Setup

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

### Layer 2: Integration Test (With Mock Fixture)

```typescript
import { expect, test } from '../../fixtures/mock';

/**
 * Test Scope:
 * ✅ API integration, state transitions, error recovery
 * ❌ Data mutations (avoiding parallel logic)
 */

test('handles API error with retry flow', async ({ page, mock }) => {
    // 1. Override mocks for failure scenario
    await mock.add('identityServiceDown');

    // 2. Navigate
    await page.goto('/account/tokens');

    // 3. Verify error state
    await expect(page.getByText('Retry').first()).toBeVisible({ timeout: 15000 });

    // 4. Simulate service recovery
    await mock.remove('identityServiceDown');

    // 5. Verify retry works
    await page.getByText('Retry').first().click();
    await expect(page.getByText('hash-token-1')).toBeVisible();

    // Note: Token list doesn't mutate. Testing state transitions only.
});
```

### Layer 3: True E2E Test (No Mocks)

```typescript
import { expect, test } from '@playwright/test';

test('revokes token and removes from list', async ({ page }) => {
    // Real backend - token actually gets deleted
    await page.goto('/account/tokens');

    const tokenHash = await page.getByText(/hash-/).first().textContent();
    await page.getByText('Revoke').first().click();
    await page.getByRole('button', { name: 'Revoke' }).click();

    // Real data mutation - token disappears
    await expect(page.getByText(tokenHash!)).not.toBeVisible();
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

## Testing Philosophy

### Avoid Parallel Logic Implementation

**Problem:** Making mocks stateful (e.g., removing tokens on DELETE) = reimplementing business logic twice.

```typescript
// ❌ BAD: Parallel logic
// Mock removes token → Component fetches → UI updates
// Now testing that mock works, not that app works

// ✅ GOOD: Layer 2 tests state transitions
await revokeButton.click();
await expect(revokeButton).toBeDisabled(); // Loading state
await expect(revokeButton).toBeEnabled();  // Success state

// ✅ GOOD: Layer 3 tests data mutations
await revokeButton.click();
await expect(page.getByText(tokenHash)).not.toBeVisible(); // Real deletion
```

**Layer 2 verifies:** API calls, state management, error handling
**Layer 3 verifies:** Actual data changes with real backend

## Gotchas

- **Parallel logic:** Don't make Layer 2 mocks stateful. Test state transitions, not data mutations.
- **Self-signed certs:** Fixture uses Playwright's `request` (not Node `fetch`) — respects `ignoreHTTPSErrors`
- **MSW delay:** Default `withDelay(5000)` slows every mocked request by 5s. Tests involving multiple API calls can take 15-20s
- **waitForURL:** Use regex patterns (e.g. `/prompt=true/`) to avoid matching the initial URL before redirects happen
- **Prod guard:** `/api/__mock` returns 404 in prod and is excluded from prod builds via Vite plugin
