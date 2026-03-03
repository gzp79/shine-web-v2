import { expect, test } from '../../fixtures/mock';

test('shows linked identities when authenticated', async ({ page }) => {
    // Default MSW state: guest user with mock identities
    await page.goto('/__test/account/linkedidentities');

    // Wait for the card to render with identity data
    const card = page.getByRole('heading', { name: /identities/i });
    await expect(card).toBeVisible({ timeout: 10000 });

    // Verify identities are displayed (check for emails from mock data)
    await expect(page.getByText('john@example.com')).toBeVisible();
    await expect(page.getByText('john.doe@github.com')).toBeVisible();
});

test('returns 500 when identity service is down', async ({ page, mock }) => {
    await mock.add('withIdentityDown');

    // Remote function fails on server (SSR) → SvelteKit returns 500 error page
    const response = await page.goto('/__test/account/linkedidentities');
    expect(response?.status()).toBe(500);

    await expect(page.getByText('Internal Error')).toBeVisible();
});
