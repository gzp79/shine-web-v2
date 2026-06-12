import { expect, test } from '../../fixtures/mock';
import { interceptIdentityAuthWithRedirect } from '../../helpers/auth-intercept';

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
