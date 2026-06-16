import { expect, test } from '../../fixtures/mock';
import { interceptIdentityAuthWithRedirect } from '../../helpers/auth-intercept';
import { simulateTabRefocus } from '../../helpers/page-lifecycle';

test('authenticated user is redirected to the returnUrl', async ({ page }) => {
    await page.goto('/login?returnUrl=/account');

    await page.waitForURL((url) => url.pathname === '/account');
    await expect(page.getByRole('heading', { level: 1, name: 'Account', exact: true })).toBeVisible();
});

test('external returnUrl is sanitized to the default target', async ({ page }) => {
    await page.goto('/login?returnUrl=https://evil.com/phish');
    const appOrigin = new URL(page.url()).origin;

    await page.waitForURL((url) => url.pathname === '/game');

    const url = new URL(page.url());
    expect(url.pathname).toBe('/game');
    expect(url.origin).toBe(appOrigin);
    expect(url.hostname).not.toContain('evil.com');
});

test('unauthenticated user: successful token login redirects to the returnUrl', async ({ page, mock }) => {
    await mock.add('unauthorizedUser');
    await interceptIdentityAuthWithRedirect(page);

    await page.goto('/login?returnUrl=/public/bye');

    await expect(page).toHaveURL(/\/public\/bye/);
    await expect(page.getByRole('heading', { name: 'Logged Out' })).toBeVisible();
});

test('unauthenticated user: failed token login redirects to the interactive prompt', async ({ page, mock }) => {
    await mock.add('unauthorizedUser');
    await interceptIdentityAuthWithRedirect(page, 'errorUrl');

    await page.goto('/login?returnUrl=/game');

    await page.waitForURL(/prompt=true/);
    const url = new URL(page.url());
    expect(url.searchParams.get('prompt')).toBe('true');
});

test('server down during initial load shows retry and recovers', async ({ page, mock }) => {
    await mock.add('withIdentityDown');

    await page.goto('/login?returnUrl=/game');
    const retryButton = page.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible();

    await mock.remove('withIdentityDown');

    await retryButton.click();
    await expect(page.getByRole('button', { name: /retry/i })).not.toBeVisible();
    const url = new URL(page.url());
    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('returnUrl')).toBe('/game');
});

test('auth layout: failed load that recovers as unauthenticated redirects to login', async ({ page, mock }) => {
    // First load of a guarded page fails (identity server down).
    await mock.add('withIdentityDown');

    await page.goto('/account');
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await expect(refreshButton).toBeVisible();

    // The server recovers, but the user turns out to be unauthenticated.
    await mock.remove('withIdentityDown');
    await mock.add('unauthorizedUser');

    await refreshButton.click();

    // The guarded layout must send an unauthenticated user to the login page,
    // not leave them stuck on the loading card.
    await page.waitForURL((url) => url.pathname === '/login');
});

test('auth layout: failed load that recovers as authenticated renders the page', async ({ page, mock }) => {
    // First load of a guarded page fails (identity server down).
    await mock.add('withIdentityDown');

    await page.goto('/account');
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await expect(refreshButton).toBeVisible();

    // The server recovers and the user is authenticated.
    await mock.remove('withIdentityDown');

    await refreshButton.click();

    // The guarded layout must render the page, staying on /account.
    await expect(page.getByRole('heading', { level: 1, name: 'Account', exact: true })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/account');
});

test('auth layout: session expiring on a background refresh redirects to login', async ({ page, mock }) => {
    // Authenticated user lands on a guarded page.
    await page.goto('/account');
    await expect(page.getByRole('heading', { level: 1, name: 'Account', exact: true })).toBeVisible();

    // The session expires server-side.
    await mock.add('unauthorizedUser');

    // The store forces a background refresh when the tab becomes visible.
    await simulateTabRefocus(page);

    // The now-unauthenticated user must be redirected away from the guarded page.
    await page.waitForURL((url) => url.pathname === '/login');
});
