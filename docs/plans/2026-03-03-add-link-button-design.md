# AddLinkButton Design Document

**Date:** 2026-03-03
**Status:** Approved

## Overview

Create a new `AddLinkButton` component that allows authenticated users to link additional external identity providers to their account. This follows the same OAuth redirect pattern as login but without captcha requirements since the user is already authenticated.

## Requirements

- Button opens a dialog showing available external login providers
- Clicking a provider initiates OAuth linking flow (redirect-based)
- New API route proxies to identity service's external link endpoint
- After successful linking, user returns to `/account` page
- Refactor `authUrl` into `authPages` and `authApiRoutes` for better organization

## User Flow

1. User is on `/account` page viewing linked identities
2. User clicks "Link Provider" button in `LinkedIdentityCard`
3. Dialog opens showing list of available providers (same as login page)
4. User clicks a provider button
5. Form submits to `/api/auth/{provider}/link?redirectUrl=/account`
6. SvelteKit proxy forwards to identity service
7. Identity service redirects to OAuth provider
8. OAuth provider authenticates and redirects back
9. Identity service processes link and redirects to `/account`
10. User sees newly linked identity in the list

## Component Design

### AddLinkButton.svelte

**Location:** `src/lib/account/AddLinkButton.svelte`

**Props:**

- `disabled?: boolean` - External disable control
- `onerror?: (error: AppError) => void` - Error callback (matches EmailConfirmButton pattern)

**State:**

- `isDialogOpen: boolean` - Controls dialog visibility
- `isSubmitting: boolean` - Prevents double-submission during redirect

**Structure:**

```svelte
<Button onclick={() => (isDialogOpen = true)}>Link Provider</Button>

<Dialog bind:open={isDialogOpen} width="sm" title="Link Provider">
    <Box scrollShadow containerClass="w-full" contentClass="flex flex-col gap-2">
        {#each await providersQuery as provider}
            <form
                method="GET"
                action="/api/auth/{provider}/link"
                data-sveltekit-reload
                onsubmit={() => (isSubmitting = true)}
            >
                <input type="hidden" name="redirectUrl" value="/account" />
                <Button wide color="primary" type="submit" disabled={isSubmitting || disabled}>
                    <ProviderIcon size="sm" />
                    {providerName}
                </Button>
            </form>
        {/each}
    </Box>
</Dialog>
```

**Dependencies:**

- `queryExternalLoginProviders()` from `auth.remote.ts` (reused)
- UI components: Button, Dialog, Box
- Brand icons: `@lib/ui/atoms/glyphs/brands/all`

**Integration:**

- Already referenced in `LinkedIdentityCard.svelte:69`

## API Route Design

### /api/auth/[provider]/link/+server.ts

**Location:** `src/routes/api/auth/[provider]/link/+server.ts`

**Pattern:** Identical to `[provider]/login/+server.ts` but:

- Uses `authPages.externalLinkUrl()` instead of `externalLoginUrl()`
- No `captcha` parameter (user already authenticated)
- No `rememberMe` parameter (not applicable to linking)
- Only `redirectUrl` parameter needed

**Implementation:**

```typescript
export const GET: RequestHandler = async ({ params, url, fetch }) => {
    const provider = params.provider;
    if (!provider) {
        throw error(400, 'Provider parameter is required');
    }

    const identityUrl = authPages.externalLinkUrl(provider, {
        redirectUrl: sanitizedReturnUrl(url.searchParams.get('redirectUrl'))
    });
    const headers = getPassThroughHeaders();

    let response;
    try {
        response = await fetch(identityUrl, {
            method: 'GET',
            headers,
            redirect: 'manual'
        });
    } catch (err) {
        logAPI.error('Link proxy error:', err);
        throw redirect(302, resolve('/error') + '?errorType=server-down');
    }

    validateProxyResponse(response);

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: filterIncompatibleHeaders(response.headers)
    });
};
```

## authUrl Refactoring

### Problem

Current `authUrl` object mixes two concerns:

1. Identity service redirect URLs (OAuth flows) - `auth/*` paths
2. Direct API endpoints - `api/*` paths

### Solution

Split into two focused modules with clear responsibilities.

### authPages.ts

**Location:** `src/lib/server/api/authPages.ts`

**Purpose:** Identity service redirect URLs for OAuth and authentication flows

**Contains:**

- `tokenLoginUrl()` - Token-based login
- `guestLoginUrl()` - Guest login
- `emailLoginUrl()` - Email-based login
- `externalLoginUrl()` - External OAuth login
- `externalLinkUrl()` - External OAuth linking (NEW)
- `logoutUrl()` - Logout

**Export:** `export const authPages = { ... }`

### authApiRoutes.ts

**Location:** `src/lib/server/api/authApiRoutes.ts`

**Purpose:** Direct API calls to identity service

**Contains:**

- `providers()` - List available providers
- `myInfo()` - Current user info
- `linkedIdentities()` - Linked identities list
- `unlinkIdentity()` - Unlink identity
- `activeSessions()` - Active sessions list
- `activeTokens()` - Active tokens list
- `revokeToken()` - Revoke token
- Email operations: `startEmailConfirmationUrl()`, `startEmailChange()`, `completeEmailOperation()`

**Also includes all types:**

- `ProviderSchema`, `CurrentUserSchema`, `CurrentUserDetailsSchema`, etc.

**Export:** `export const authApiRoutes = { ... }`

**Why keep types here?**

- Types define API contracts
- Used alongside API route functions
- Cleaner imports for remote functions

### Migration

**Files to update:**

- `src/lib/account/auth.remote.ts` - Import `authApiRoutes`
- `src/routes/api/auth/[provider]/login/+server.ts` - Import `authPages`
- `src/routes/api/auth/[provider]/link/+server.ts` - Import `authPages` (NEW)
- `src/routes/api/auth/email/login/+server.ts` - Import `authPages`
- `src/routes/api/auth/guest/login/+server.ts` - Import `authPages`
- `src/routes/api/auth/token/login/+server.ts` - Import `authPages`
- `src/routes/api/auth/logout/+server.ts` - Import `authPages`
- Mock files if they import `authUrl`

**Process:**

1. Create `authPages.ts` with redirect URL functions
2. Create `authApiRoutes.ts` with API functions and types
3. Update all imports throughout codebase
4. Delete `src/lib/server/api/auth.ts`

## Error Handling

**Client-side:**

- `onerror` callback prop receives `AppError`
- Component handles submission state (prevents double-submit)
- Dialog state management

**Server-side:**

- Proxy catches fetch errors and redirects to `/error?errorType=server-down`
- `validateProxyResponse()` validates identity service response
- Pass-through headers maintained for session tracking

**OAuth errors:**

- Identity service handles OAuth errors
- Redirects to `errorUrl` (set to `/error`) on failure
- Error page displays appropriate message

## Success Handling

**Redirect flow:**

1. Identity service completes OAuth link
2. Redirects to `redirectUrl=/account`
3. SvelteKit loads `/account` page
4. `LinkedIdentityCard` automatically refreshes via `queryLinkedIdentities()`
5. User sees newly linked identity in list

**No explicit success message needed:**

- Presence of new identity in list is sufficient feedback
- Matches existing pattern for unlink operation

## Testing Considerations

**Unit tests:**

- AddLinkButton component rendering
- Dialog open/close behavior
- Form submission with correct parameters

**Integration tests:**

- API route proxies correctly
- Redirect flow works end-to-end
- Error handling for various failure scenarios

**E2E tests:**

- Full linking flow with mock OAuth provider
- Return to account page after linking
- Linked identity appears in list

## Implementation Order

1. **Refactor authUrl** (foundation for new route)
    - Create `authPages.ts` and `authApiRoutes.ts`
    - Update all imports
    - Delete old `auth.ts`
    - Verify builds successfully

2. **Create API route** (backend for linking)
    - Create `/api/auth/[provider]/link/+server.ts`
    - Test with existing identity service

3. **Create AddLinkButton component** (UI)
    - Implement component with dialog
    - Add to `LinkedIdentityCard`
    - Manual testing in browser

4. **Testing** (validation)
    - Add unit tests
    - Add E2E tests
    - Verify full flow

## Open Questions

None - all clarified during design phase.

## Decision Log

- **Show all providers vs filter linked:** Show all providers, backend handles duplicates
- **Success handling:** Close dialog and auto-refresh linked identities list via redirect
- **Return URL:** Always return to `/account` page
- **Captcha:** Not required (user already authenticated)
- **Naming:** `authPages` + `authApiRoutes` for split modules
