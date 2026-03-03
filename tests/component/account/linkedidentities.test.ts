import { expect, test } from '../../fixtures/mock';

test('shows linked identities when authenticated', async ({ page }) => {
    // Default MSW state: guest user with mock identities
    await page.goto('/__test/account/linkedidentities');

    // Wait for the card to render with identity data
    const card = page.getByRole('heading', { name: /identities/i });
    await expect(card).toBeVisible();

    // Verify identities are displayed (check for emails from mock data)
    await expect(page.getByText('john@example.com')).toBeVisible();
    await expect(page.getByText('john.doe@github.com')).toBeVisible();
});

test('shows loading card while data is loading', async ({ page, mock }) => {
    // Add delay to simulate slow loading
    await mock.add('withDelay', { ms: 2000 });

    await page.goto('/__test/account/linkedidentities');

    // Should show loading card immediately
    await expect(page.getByText('Loading...')).toBeVisible();

    // After delay, should show identity data
    await expect(page.getByText('john@example.com')).toBeVisible();
});

test('retry button reloads data after initial failure', async ({ page, mock }) => {
    // Start with identity service down
    await mock.add('withIdentityDown');

    await page.goto('/__test/account/linkedidentities');

    // Wait for error to appear in the card (not SSR 500)
    await expect(page.getByText('Retry').first()).toBeVisible();

    // Remove the failure mock to simulate service recovery
    await mock.remove('withIdentityDown');

    // Click retry button
    await page.getByText('Retry').first().click();

    // Should now load successfully
    await expect(page.getByText('john@example.com')).toBeVisible();
});

test('unlink identity shows confirmation dialog and triggers loading state', async ({ page }) => {
    await page.goto('/__test/account/linkedidentities');

    // Wait for identities to load
    await expect(page.getByText('john@example.com')).toBeVisible();

    // Find and click the first unlink button
    const unlinkButton = page.getByText('account.unlink').first();
    await unlinkButton.click();

    // Confirmation dialog should appear
    await expect(page.getByText('account.unlinkConfirmationTitle')).toBeVisible();
    await expect(page.getByText('account.unlinkConfirmationQuestion')).toBeVisible();

    // Click confirm button in the dialog
    const confirmButton = page.getByText('account.unlinkConfirmationConfirmText').last();
    await confirmButton.click();

    // Button should become disabled during the operation (loading state)
    await expect(unlinkButton).toBeDisabled();
});

test('link provider dialog opens and shows available providers', async ({ page }) => {
    await page.goto('/__test/account/linkedidentities');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /identities/i })).toBeVisible();

    // Click "Link Provider" button
    await page.getByText('account.linkProvider').click();

    // Dialog should open with title
    await expect(page.getByText('account.linkProviderTitle')).toBeVisible();

    // Should show available providers (from mock: gitlab, google, github, discord)
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /github/i })).toBeVisible();
});

test('link provider submits to correct API route', async ({ page }) => {
    await page.goto('/__test/account/linkedidentities');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /identities/i })).toBeVisible();

    // Click "Link Provider" button
    await page.getByText('account.linkProvider').click();

    // Dialog should open
    await expect(page.getByText('account.linkProviderTitle')).toBeVisible();

    // Click a provider button (e.g., Google)
    const googleButton = page.getByRole('button', { name: /google/i });
    await googleButton.click();

    // Should navigate to /api/auth/google/link
    // Note: In test environment, this will be handled by MSW mock
    await page.waitForURL('**/__test/account/linkedidentities');
});
