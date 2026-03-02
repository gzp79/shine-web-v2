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
