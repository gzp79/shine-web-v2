import { expect, test } from '../../fixtures/mock';

test('non-interactive token flow fails and redirects to prompt login', async ({ page, mock }) => {
    await mock.add('unauthorizedUser');
    await mock.add('tokenLogin', { success: false });

    await page.goto('/login?returnUrl=/game');

    // Wait for redirect back with prompt=true (regex won't match initial URL)
    await page.waitForURL(/prompt=true/, { timeout: 30000 });
    const url = new URL(page.url());
    expect(url.searchParams.get('prompt')).toBe('true');
});

test('server down during initial load, recovers after retry', async ({ page, mock }) => {
    // 1. Simulate server down
    await mock.add('withIdentityDown');

    // 2. Navigate triggers error
    await page.goto('/login?returnUrl=/game');

    // 3. Verify ErrorCard with retry button (wait for query retries to exhaust)
    const retryButton = page.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible({ timeout: 20000 });

    // 4. Simulate server recovery
    await mock.remove('withIdentityDown');

    // 5. Trigger retry
    await retryButton.click();

    // 6. Verify successful recovery - page loads without error
    await expect(page.getByRole('button', { name: /retry/i })).not.toBeVisible({ timeout: 30000 });
    const url = new URL(page.url());
    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('returnUrl')).toBe('/game');
});
