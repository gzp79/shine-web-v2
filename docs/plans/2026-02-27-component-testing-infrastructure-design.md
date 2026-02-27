# Component Testing Infrastructure

**Date:** 2026-02-27
**Status:** Approved
**Author:** Claude (brainstorming session)

## Overview

Establish a testing infrastructure that enables testing components with remote functions using real SvelteKit server behavior, while improving unit test performance and organizing different test types appropriately.

## Goals

1. Enable testing components that use remote functions (like `UserInfoCard`) without mocking Svelte or remote function internals
2. Speed up unit tests by switching from browser mode to happy-dom
3. Separate component integration tests from E2E tests and unit tests
4. Protect test routes from production deployment

## Non-Goals

- Implementation of mock API endpoint (handled separately)
- Testing all UserInfoCard scenarios (only 503 error initially)
- Git workflow and commits (user will handle)

## Design

### 1. Component Refactoring: UserInfoCard

**Current state:**

```svelte
<script lang="ts">
    let { userInfo }: UserInfoCardProps = $props();
    // Uses userInfo as prop
</script>
```

**New approach:**

```svelte
<script lang="ts">
    import { queryCurrentUserInfo } from './auth.remote';

    const userInfo = queryCurrentUserInfo();
    // Component owns data fetching
</script>
```

**Changes:**

- Remove `UserInfoCardProps` type definition
- Remove `userInfo` prop
- Import and call `queryCurrentUserInfo()` directly
- All UI logic remains unchanged (loading states, error handling, display)

**Impact:**

- Component becomes self-contained
- Any existing code passing `userInfo` prop needs updates
- Component lifecycle tied to remote function lifecycle

### 2. Vitest Configuration: Switch to happy-dom

**Current config (`vite.config.ts`):**

```typescript
test: {
    browser: {
        enabled: true,
        provider: playwright()  // All tests run in real browser
    },
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['src/lib/server/**']
}
```

**New config:**

```typescript
test: {
    environment: 'happy-dom',  // Fast DOM simulation
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['src/lib/server/**']
}
```

**Benefits:**

- 10-100x faster test execution for unit tests
- No changes needed to existing test files
- Still supports DOM, events, user interactions
- Compatible with @testing-library/svelte and Svelte 5

**Dependencies:**

- Add `happy-dom` as dev dependency

**Affected tests:**

- `ZodField.test.ts` - will run faster
- `ComboButton.test.ts` - will run faster
- All other `src/**/*.test.ts` files - will run faster

### 3. Component Test Infrastructure

**Directory structure:**

```
tests/
├── component/              # Component integration tests (Playwright)
│   └── account/
│       └── userinfo.spec.ts
└── e2e/                    # Full user journey tests (Playwright)
    └── [existing e2e tests]

src/
├── routes/
│   └── __component_test/   # Test routes (protected from prod)
│       ├── +layout.server.ts
│       └── account/
│           └── userinfo/
│               └── +page.svelte
└── [existing unit tests in **/*.test.ts]
```

**Test organization:**

- `src/**/*.test.ts` - Unit tests with happy-dom (fast, no server)
- `tests/component/` - Component integration tests with Playwright (server required)
- `tests/e2e/` - Full user workflow tests with Playwright (multi-page)

### 4. Test Route Protection

**Guard implementation (`src/routes/__component_test/+layout.server.ts`):**

```typescript
import { config } from '@config';
import { error } from '@sveltejs/kit';

export const load = () => {
    // Block access in production
    if (config.environment === 'prod') {
        throw error(404, 'Not found');
    }

    return {};
};
```

**Build exclusion (`svelte.config.js`):**

```javascript
const config = {
    kit: {
        adapter: adapter(),
        prerender: {
            entries: ['*', '!/__component_test/**']
        }
    }
};
```

**Protection layers:**

1. Route naming convention: `__component_test` (dunder = internal)
2. Runtime guard: Returns 404 in production environment
3. Build optimization: Excluded from prerender
4. Global: All routes under `__component_test/` are protected

### 5. Initial Test Implementation

**Test page (`src/routes/__component_test/account/userinfo/+page.svelte`):**

```svelte
<script>
    import UserInfoCard from '$lib/account/UserInfoCard.svelte';
</script>

<UserInfoCard />
```

**Playwright test (`tests/component/account/userinfo.spec.ts`):**

```typescript
import { expect, test } from '@playwright/test';

test.describe('UserInfoCard Component', () => {
    test('shows error card when remote function returns 503', async ({ page, request }) => {
        // Setup mock via __mock API endpoint (implemented separately)
        await request.post('/api/__mock', {
            data: {
                endpoint: 'auth/user/info',
                status: 503
            }
        });

        await page.goto('/__component_test/account/userinfo');

        // Verify ErrorCard is displayed
        await expect(page.getByRole('alert')).toBeVisible();
    });

    // Future tests will be added here
});
```

**Test flow:**

1. Test calls mock API endpoint to configure 503 response
2. Test navigates to component test route
3. UserInfoCard renders and calls `queryCurrentUserInfo()`
4. Remote function executes through real SvelteKit server
5. Server returns 503 (via mock control)
6. Component displays ErrorCard
7. Test verifies ErrorCard is visible

## Testing Strategy Summary

| Test Type | Location           | Tools              | Server | Use Case                         |
| --------- | ------------------ | ------------------ | ------ | -------------------------------- |
| Unit      | `src/**/*.test.ts` | Vitest + happy-dom | No     | Simple UI components with props  |
| Component | `tests/component/` | Playwright         | Yes    | Components with remote functions |
| E2E       | `tests/e2e/`       | Playwright         | Yes    | Full user workflows              |

## Files to Create

1. `src/routes/__component_test/+layout.server.ts` - Production guard
2. `src/routes/__component_test/account/userinfo/+page.svelte` - Test page
3. `tests/component/account/userinfo.spec.ts` - Initial test

## Files to Modify

1. `vite.config.ts` - Switch from browser mode to happy-dom
2. `svelte.config.js` - Add prerender exclusion for `__component_test`
3. `package.json` - Add `happy-dom` dependency
4. `src/lib/account/UserInfoCard.svelte` - Remove prop, add direct remote function call

## Dependencies

- Add: `happy-dom` (dev dependency)
- Existing: `@playwright/test`, `@testing-library/svelte`, `vitest`

## Future Work (Out of Scope)

- Mock API endpoint implementation (separate design)
- Additional test cases for UserInfoCard (loading, authenticated user, etc.)
- Testing other components with remote functions
- Performance benchmarking of happy-dom vs browser mode

## Success Criteria

1. ✅ Vitest unit tests run significantly faster with happy-dom
2. ✅ UserInfoCard can be tested with real remote function behavior
3. ✅ Test routes are protected from production deployment
4. ✅ 503 error test passes and verifies ErrorCard display
5. ✅ Clear separation between unit, component, and E2E tests
