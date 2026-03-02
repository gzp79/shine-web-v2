# Component Testing Infrastructure - Design

**Goal:** Enable testing components that use remote functions by mounting them in real SvelteKit routes, controlled by the same mock fixture used by E2E tests.

**Tech Stack:** Vitest (unit), Playwright (component + E2E), MSW, SvelteKit, happy-dom

---

## Test Tiers

Three tiers, each with increasing scope and cost:

| Tier          | Runner     | Environment | Server                  | Mock strategy            |
| ------------- | ---------- | ----------- | ----------------------- | ------------------------ |
| **Unit**      | Vitest     | happy-dom   | None                    | Direct imports / vi.mock |
| **Component** | Playwright | Chromium    | SvelteKit preview (MSW) | Mock fixture via HTTP    |
| **E2E**       | Playwright | Chromium    | SvelteKit preview (MSW) | Mock fixture via HTTP    |

Component and E2E tests share the same Playwright webServer (SvelteKit built with MSW) and the same mock fixture. They differ only in what they exercise:

- **Component tests** navigate to `/__test/` routes that mount a single component in isolation
- **E2E tests** navigate to real app routes and exercise full user flows

**When to use which:**

- Unit — pure logic, components with props only, no server interaction
- Component — components that call remote functions, need MSW to shape server responses
- E2E — multi-page flows, navigation, full user journeys

---

## Test Infrastructure Layout

```
tests/
├── fixtures/
│   └── mock.ts              ← shared MockFixture (from mock-api design)
├── component/
│   └── account/
│       └── userinfo.test.ts  ← mounts /__test/account/userinfo
└── e2e/
    └── login/
        └── token-flow.test.ts

src/routes/
├── __test/
│   ├── +layout.server.ts    ← runtime prod guard (404)
│   └── account/
│       └── userinfo/
│           └── +page.svelte  ← mounts UserInfoCard in isolation
├── api/
│   └── __mock/
│       └── +server.ts       ← mock control endpoint (from mock-api design)
└── ... (real app routes)
```

**Key points:**

- `tests/fixtures/` is the shared home — both `tests/component/` and `tests/e2e/` import `../fixtures/mock`
- `__test` routes are thin wrappers that mount a single component with no layout chrome
- The `+layout.server.ts` guard at `__test/` root protects the entire subtree

---

## Test Route Guard

**File:** `src/routes/__test/+layout.server.ts`

Returns 404 in production. Identical pattern to the `api/__mock` endpoint guard.

```typescript
import { config } from '@config';
import { error } from '@sveltejs/kit';

export const load = () => {
    if (config.environment === 'prod') {
        throw error(404, 'Not found');
    }
    return {};
};
```

---

## Production Exclusion

One Vite plugin handles both `__mock` and `__test` with explicit path matching. This replaces the `excludeMockRoutes` plugin from the mock-api design.

```typescript
function excludeTestInfraRoutes(): Plugin {
    const excluded = ['__mock', '__test'];
    return {
        name: 'exclude-test-infra-routes',
        resolveId(id) {
            if (config.environment === 'prod' && excluded.some((p) => id.includes(p))) {
                return '\0empty-test-infra';
            }
        },
        load(id) {
            if (id === '\0empty-test-infra') return '';
        }
    };
}
```

Defense-in-depth: runtime guards in both `__test/+layout.server.ts` and `api/__mock/+server.ts` still return 404 even if the Vite plugin is bypassed.

---

## Playwright Configuration

Single `playwright.config.ts` with two projects sharing the same webServer:

```typescript
projects: [
    {
        name: 'component',
        testDir: 'tests/component',
        testMatch: '**/*.test.ts'
    },
    {
        name: 'e2e',
        testDir: 'tests/e2e',
        testMatch: '**/*.test.ts'
    }
];
```

Run targets:

- `pnpm test:e2e` — all Playwright tests (both projects)
- `pnpm test:e2e --project=component` — component tests only
- `pnpm test:e2e --project=e2e` — E2E tests only

---

## Shared Mock Fixture

Both test types import identically from `tests/fixtures/mock.ts` (defined in the [mock-api design](./2026-02-27-mock-api-design.md)):

```typescript
// tests/component/account/userinfo.test.ts
import { expect, test } from '../fixtures/mock';

test('shows error card when identity service is down', async ({ page, mock }) => {
    await mock.add('withIdentityDown');
    await page.goto('/__test/account/userinfo');

    const errorCard = page.getByRole('alert');
    await expect(errorCard).toBeVisible();
});
```

```typescript
// tests/e2e/login/token-flow.test.ts
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

Same fixture, same `mock.add`/`mock.remove`/`mock.reset` API, same auto-reset teardown. The only difference is what URL the test navigates to — `/__test/...` for component tests, real routes for E2E.

---

## Vitest Configuration

Unit tests switch from browser-mode Playwright to happy-dom for speed:

```typescript
test: {
    expect: { requireAssertions: true },
    reporters: isCI ? ['github-actions'] : ['default'],
    environment: 'happy-dom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['src/lib/server/**']
}
```

The `@vitest/browser-playwright` import and browser config are removed.

---

## UserInfoCard Refactor

**File:** `src/lib/account/UserInfoCard.svelte`

UserInfoCard currently receives `userInfo: QueryLike<CurrentUser>` as a prop from its parent. To make it self-contained and testable via a `__test` route, it should call the remote function internally instead.

**Current (prop-based):**

```svelte
<script module lang="ts">
    // ...imports...
    export type UserInfoCardProps = { userInfo: QueryLike<CurrentUser> };
</script>

<script lang="ts">
    let { userInfo }: UserInfoCardProps = $props();
</script>
```

**Target (remote function call):**

```svelte
<script module lang="ts">
    // ...imports...
    import { queryCurrentUserInfo } from './auth.remote';
</script>

<script lang="ts">
    const userInfo = queryCurrentUserInfo();
</script>
```

**What changes:**

- Remove the `UserInfoCardProps` type export and `$props()` destructuring
- Import and call `queryCurrentUserInfo()` directly in the instance script
- Remove the `userInfo` prop from any parent component that currently passes it
- The test route page becomes a zero-config mount: `<UserInfoCard />`

**Why:** A self-contained component that owns its data fetching is independently mountable in a `__test` route without needing a parent to wire up the query. MSW controls what the remote function returns — the test page itself needs no setup.

---

## File Summary

| File                                  | Action | Description                                                                           |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------- |
| `vite.config.ts`                      | Modify | Switch Vitest to happy-dom, replace `excludeMockRoutes` with `excludeTestInfraRoutes` |
| `playwright.config.ts`                | Modify | Add `component` and `e2e` projects                                                    |
| `src/routes/__test/+layout.server.ts` | Create | Runtime prod guard for test routes                                                    |
| `tests/fixtures/mock.ts`              | Move   | Relocate from `tests/e2e/fixtures/mock.ts` to shared location                         |
| `src/lib/account/UserInfoCard.svelte` | Modify | Replace `userInfo` prop with internal `queryCurrentUserInfo()` call                   |

Test route pages and test files are created per-component as needed. The first example:

| File                                              | Action | Description                              |
| ------------------------------------------------- | ------ | ---------------------------------------- |
| `src/routes/__test/account/userinfo/+page.svelte` | Create | Thin wrapper mounting `<UserInfoCard />` |
| `tests/component/account/userinfo.test.ts`        | Create | Component test for UserInfoCard          |
