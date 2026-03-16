import { expect, test } from '../../fixtures/mock';
import { interceptIdentityAuthWithRedirect } from '../../helpers/auth-intercept';

test('non-interactive token flow fails and redirects to prompt login', async ({ page, mock }) => {
    await mock.add('unauthorizedUser');
    await interceptIdentityAuthWithRedirect(page, 'errorUrl');

    await page.goto('/login?returnUrl=/game');

    await page.waitForURL(/prompt=true/, { timeout: 30000 });
    const url = new URL(page.url());
    expect(url.searchParams.get('prompt')).toBe('true');
});

test('server down during initial load, recovers after retry', async ({ page, mock }) => {
    await mock.add('withIdentityDown');

    await page.goto('/login?returnUrl=/game');
    const retryButton = page.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible({ timeout: 20000 });

    await mock.remove('withIdentityDown');

    await retryButton.click();
    await expect(page.getByRole('button', { name: /retry/i })).not.toBeVisible({ timeout: 30000 });
    const url = new URL(page.url());
    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('returnUrl')).toBe('/game');
});
