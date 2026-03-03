import { expect, test } from '../../fixtures/mock';

test('shows active sessions when authenticated', async ({ page }) => {
    // Default MSW state: guest user with mock sessions
    await page.goto('/__test/account/activesessions');

    // Wait for the card to render with session data
    const card = page.getByRole('heading', { name: /active sessions/i });
    await expect(card).toBeVisible();

    // Verify sessions are displayed (check for fingerprints from mock data)
    await expect(page.getByText('fp-chrome-windows')).toBeVisible();
    await expect(page.getByText('fp-safari-mac')).toBeVisible();
});

test('shows loading card while data is loading', async ({ page, mock }) => {
    // Add delay to simulate slow loading
    await mock.add('withDelay', { ms: 2000 });

    await page.goto('/__test/account/activesessions');

    // Should show loading card immediately
    await expect(page.getByText('Loading...')).toBeVisible();

    // After delay, should show session data
    await expect(page.getByText('fp-chrome-windows')).toBeVisible();
});

test('retry button reloads data after initial failure', async ({ page, mock }) => {
    // Start with identity service down
    await mock.add('withIdentityDown');

    await page.goto('/__test/account/activesessions');

    // Wait for error to appear in the card (not SSR 500)
    await expect(page.getByText('Retry').first()).toBeVisible();

    // Remove the failure mock to simulate service recovery
    await mock.remove('withIdentityDown');

    // Click retry button
    await page.getByText('Retry').first().click();

    // Should now load successfully
    await expect(page.getByText('fp-chrome-windows')).toBeVisible();
});
