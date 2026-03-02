import { expect, test } from '../../fixtures/mock';

test('shows user info when authenticated as guest', async ({ page }) => {
    // Default MSW state: guest user authenticated
    await page.goto('/__test/account/userinfo');

    // Wait for the card to render with user data
    const card = page.locator('[data-testid="user-info-card"]').or(page.getByText('Freshman'));
    await expect(card.first()).toBeVisible({ timeout: 10000 });
});

test('returns 500 when identity service is down', async ({ page, mock }) => {
    await mock.add('withIdentityDown');

    // Remote function fails on server (SSR) → SvelteKit returns 500 error page
    const response = await page.goto('/__test/account/userinfo');
    expect(response?.status()).toBe(500);

    await expect(page.getByText('Internal Error')).toBeVisible();
});
