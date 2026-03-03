import { expect, test } from '../../fixtures/mock';

test('shows active sessions when authenticated', async ({ page }) => {
    test.setTimeout(60000); // MSW has 5s delay per request

    // Default MSW state: guest user with mock sessions
    await page.goto('/__test/account/activesessions');

    // Wait for the card to render with session data (MSW has 5s delay)
    const card = page.getByRole('heading', { name: /active sessions/i });
    await expect(card).toBeVisible({ timeout: 15000 });

    // Verify sessions are displayed (check for fingerprints from mock data)
    await expect(page.getByText('fp-chrome-windows')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('fp-safari-mac')).toBeVisible({ timeout: 10000 });
});

test('returns 500 when identity service is down', async ({ page, mock }) => {
    await mock.add('withIdentityDown');

    // Remote function fails on server (SSR) → SvelteKit returns 500 error page
    const response = await page.goto('/__test/account/activesessions');
    expect(response?.status()).toBe(500);

    await expect(page.getByText('Internal Error')).toBeVisible();
});
