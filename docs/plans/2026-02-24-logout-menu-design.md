# Logout Menu Design

**Date:** 2026-02-24
**Status:** Approved

## Overview

Add a logout menu item to the authenticated app menu that allows users to log out of their session. The logout flow prioritizes local session cleanup and user experience over backend communication reliability.

## Architecture

The logout feature consists of three main parts:

1. **Menu Integration** - A single "Logout" menu item dynamically registered in the AppMenu using the `MenuContext.register()` API from `(auth)/layout.svelte`. This ensures it only appears in authenticated routes and automatically cleans up when leaving auth context.

2. **API Endpoint** - A new `/api/auth/logout` GET endpoint that handles the logout flow: attempts to notify the backend identity server, always deletes local session cookies (`sid`, `tid`, `eid`), and redirects to a goodbye page.

3. **Goodbye Page** - A simple `/public/bye` route showing a friendly logout confirmation message with a link back to login/home.

**Key architectural principles:**

- **Separation of concerns** - UI registration happens in layout, business logic in API endpoint, presentation in bye page
- **Resilient by design** - Local session cleanup always succeeds regardless of backend state
- **Consistent patterns** - Follows existing auth API proxy patterns and menu registration system

## Components

### 1. Menu Registration (`src/routes/(auth)/+layout.svelte`)

Add menu registration logic using `onMount`:

- Get `MenuContext` via `getMenuContext()`
- Get `LocaleContext` for translations
- Register a single MenuItem with:
    - `id: 'logout'`
    - `section: 'user'` (appears at bottom of menu)
    - `label: locale.t('account.logout')`
    - `icon: Cross` (or similar exit icon)
    - `dangerous: true` (red styling to indicate session-ending action)
    - `action: () => { window.location.href = '/api/auth/logout'; }` (client-side navigation to API route)
- Return unregister function from `onMount` for automatic cleanup

### 2. API Endpoint (`src/routes/api/auth/logout/+server.ts`)

New GET handler following the proxy pattern from existing auth endpoints:

- Extract `terminateAll` query param (defaults to `false`)
- Build identity server URL using `authUrl.logoutUrl({ terminateAll, redirectUrl: '/public/bye' })`
- Attempt backend call with `getPassThroughHeaders()` and `redirect: 'manual'`
- Wrap in try/catch - log errors with `logAPI.error()` but don't throw
- Always delete browser cookies by setting them as expired:
    - `cookies.delete('sid', { path: '/' })` (sets `Set-Cookie: sid=; expires=Thu, 01 Jan 1970...`)
    - `cookies.delete('tid', { path: '/' })`
    - `cookies.delete('eid', { path: '/' })`
    - These Set-Cookie headers tell the browser to remove the cookies
- Always redirect to `/public/bye` using `throw redirect(302, resolve('/public/bye'))`

**Note:** The API supports `terminateAll=true` for logout from all devices, but this is not exposed in the UI. It exists for future use.

### 3. Goodbye Page (`src/routes/public/bye/+page.svelte`)

Simple page following the pattern from `/public/email-login`:

- Use `CenteredLayout` + `Card` for consistent styling
- Display translated title and message using `locale.t('account.byeTitle')` and `locale.t('account.byeMessage')`
- Include a Button linking back to `/login` or `/` with text like "Back to Home"
- Keep it minimal and friendly

### 4. Translation Keys

Add to `src/lib/i18n/locales/en.json` and `hu.json`:

- `account.logout` - "Logout" (already exists)
- `account.byeTitle` - "Logged Out"
- `account.byeMessage` - "You have been successfully logged out. Thank you for using our service!"

## Data Flow

**User logout sequence:**

1. **User clicks "Logout" in AppMenu** → MenuItem's `action` handler fires
2. **Client navigates** → `window.location.href = '/api/auth/logout'` (full page navigation)
3. **API endpoint receives request** → SvelteKit server handler executes
4. **Backend notification attempt** → API calls identity server's logout endpoint with:
    - `terminateAll=false`
    - `redirectUrl=https://www.scytta.com/public/bye` (absolute URL)
    - Pass-through headers including existing cookies
5. **Backend responds** → Either success (2xx), error (5xx), or network failure
6. **Error handling** → Any errors are logged via `logAPI.error()` but flow continues
7. **Cookie deletion** → API sets `Set-Cookie` headers with expired dates for `sid`, `tid`, `eid`
8. **Browser receives response** → Gets 302 redirect to `/public/bye` + cookie deletion headers
9. **Browser processes** → Deletes cookies from storage, navigates to bye page
10. **Goodbye page loads** → Shows confirmation message with link back home
11. **Future authenticated requests** → Fail due to missing cookies, redirect to login

**Key data points:**

- **Cookies deleted:** `sid` (session), `tid` (token), `eid` (external ID)
- **Query param supported:** `terminateAll` (boolean, defaults to false)
- **Backend parameters:** `terminateAll`, `redirectUrl`
- **No return data** → Always redirects, never returns JSON

## Error Handling

**Error scenarios and responses:**

**1. Backend identity server is down/unreachable**

- API's `fetch()` call throws exception
- Caught by try/catch block
- Logged: `logAPI.error('Logout proxy error:', err)`
- Flow continues → cookies deleted → redirect to `/public/bye`
- **User impact:** None - logout appears to succeed normally

**2. Backend returns 5xx server error**

- API's `fetch()` succeeds but returns error status
- Logged: `logAPI.error('Logout upstream error: {status}')`
- Flow continues → cookies deleted → redirect to `/public/bye`
- **User impact:** None - logout appears to succeed normally

**3. Backend returns unexpected response**

- No explicit validation needed
- Flow continues regardless of response content
- **User impact:** None - logout always completes

**4. Cookie deletion fails (unlikely)**

- SvelteKit's `cookies.delete()` is synchronous and doesn't throw
- If browser doesn't respect Set-Cookie headers, cookies remain
- User may still appear logged in on next request
- **Mitigation:** Backend should also invalidate session when logout endpoint is called

**5. Redirect fails (very unlikely)**

- SvelteKit's `throw redirect()` is the standard pattern
- If redirect somehow fails, user would see blank page or error
- **Mitigation:** None needed - this is framework-level reliability

**Logging strategy:**

- Use `logAPI.error()` for all backend failures
- Use `logAPI.log()` or `.debug()` for successful flow (optional)
- Never expose error details to user - logout always "succeeds"

**No error page redirects** - Unlike login endpoints that redirect to `/error?errorType=server-down`, logout always goes to `/public/bye`.

## Testing Strategy

**Manual testing checklist:**

**Menu Integration:**

- [ ] "Logout" item appears in AppMenu when on authenticated routes (`/game`, `/account`)
- [ ] Menu item has correct icon and label (localized)
- [ ] Menu item has red/dangerous styling
- [ ] Menu item does NOT appear on public routes (`/login`, `/error`)
- [ ] Test in both English and Hungarian

**Logout Flow - Happy Path:**

- [ ] Click "Logout" → navigates to `/api/auth/logout`
- [ ] Redirects to `/public/bye` page
- [ ] Goodbye page shows correct title and message (localized)
- [ ] Browser cookies (`sid`, `tid`, `eid`) are deleted (check DevTools → Application → Cookies)
- [ ] Attempt to access `/game` or `/account` → redirects to `/login`

**Logout Flow - Backend Down:**

- [ ] Stop backend identity server (or mock network failure)
- [ ] Click "Logout" → still redirects to `/public/bye`
- [ ] Cookies still deleted
- [ ] Check browser console → should see `logAPI.error()` messages
- [ ] User experience is identical to happy path

**Logout Flow - Direct API Access:**

- [ ] Navigate directly to `/api/auth/logout` in browser
- [ ] Should redirect to `/public/bye` and delete cookies
- [ ] Navigate to `/api/auth/logout?terminateAll=true`
- [ ] Should work identically (terminateAll sent to backend but not exposed in UI)

**Edge Cases:**

- [ ] Rapid clicking "Logout" multiple times → should handle gracefully
- [ ] Logout when already logged out (no cookies) → should still show bye page
- [ ] Logout from different pages (`/game` vs `/account`) → consistent behavior

**No automated tests needed** for this feature since it's primarily integration/E2E behavior involving browser cookies, navigation, and external backend calls. Manual testing is sufficient.

## Design Decisions

### Why single menu item instead of submenu?

Initially considered a submenu (like ThemeMenu) with "Logout" and "Logout from all devices", but simplified to a single menu item to reduce complexity. The "logout from all" functionality remains in the API for future use but is not exposed in the UI.

### Why server-side cookie deletion only?

The auth cookies are likely HttpOnly for security, so server-side deletion via `cookies.delete()` is essential. Client-side deletion would add complexity without benefit.

### Why silent error handling?

Logout should always succeed from the user's perspective. Backend communication failures shouldn't prevent local session cleanup. The user's intent is to end their session, and that can always be accomplished by deleting local cookies.

### Why direct redirect instead of proxying backend response?

We control the UX, and the "goodbye" page is our design decision. Letting the backend determine the destination would be less predictable and harder to maintain.
