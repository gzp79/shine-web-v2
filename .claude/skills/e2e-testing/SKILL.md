---
name: e2e-testing
description: Playwright E2E testing with MSW mock control. Use when writing or debugging tests/e2e/**/*.test.ts files.
---

# E2E Testing

## Setup

- **Framework:** Playwright
- **Mocks:** MSW via HTTP control API (`/api/__mock`)
- **Test dir:** `tests/e2e/` (nested by feature)
- **Fixture:** `tests/e2e/fixtures/mock.ts`
- **Run:** `pnpm test:e2e`
- **Env required:** `pnpm run env:mock` before running

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

## Test Pattern

```typescript
import { expect, test } from '../fixtures/mock';

test('description', async ({ page, mock }) => {
    // 1. Override mocks for this scenario
    await mock.add('unauthorizedUser');
    await mock.add('tokenLogin', { success: false });

    // 2. Navigate
    await page.goto('/login?returnUrl=/game');

    // 3. Assert (use regex for waitForURL to avoid matching initial URL)
    await page.waitForURL(/prompt=true/, { timeout: 30000 });
    const url = new URL(page.url());
    expect(url.searchParams.get('prompt')).toBe('true');
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

## Gotchas

- **Self-signed certs:** Fixture uses Playwright's `request` (not Node `fetch`) — respects `ignoreHTTPSErrors`
- **MSW delay:** Default `withDelay(5000)` slows every mocked request by 5s. Tests involving multiple API calls can take 15-20s
- **waitForURL:** Use regex patterns (e.g. `/prompt=true/`) to avoid matching the initial URL before redirects happen
- **Prod guard:** `/api/__mock` returns 404 in prod and is excluded from prod builds via Vite plugin
