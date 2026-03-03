import { expect, test } from '../../fixtures/mock';

test('shows active tokens when authenticated', async ({ page }) => {
    test.setTimeout(60000); // MSW has 5s delay per request

    // Default MSW state: guest user with mock tokens
    await page.goto('/__test/account/activetokens');

    // Wait for the card to render with token data (MSW has 5s delay)
    const card = page.getByRole('heading', { name: /active tokens/i });
    await expect(card).toBeVisible({ timeout: 15000 });

    // Verify tokens are displayed (check for token hashes from mock data)
    await expect(page.getByText('hash-token-1')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('hash-token-2')).toBeVisible({ timeout: 10000 });
});

test('returns 500 when identity service is down', async ({ page, mock }) => {
    await mock.add('withIdentityDown');

    // Remote function fails on server (SSR) → SvelteKit returns 500 error page
    const response = await page.goto('/__test/account/activetokens');
    expect(response?.status()).toBe(500);

    await expect(page.getByText('Internal Error')).toBeVisible();
});
