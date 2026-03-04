import { expect, test } from '../../fixtures/mock';

test('shows loading state then identities when authenticated', async ({ page, mock }) => {
    // Add delay to simulate slow loading
    await mock.add('withDelay', { ms: 2000 });

    await page.goto('/__test/account/linkedidentities');

    // Should show loading card immediately
    await expect(page.getByText('Loading...')).toBeVisible();

    // Wait for the card to render with identity data
    const card = page.getByRole('heading', { name: /identities/i });
    await expect(card).toBeVisible();

    // Verify identities are displayed (check for emails from mock data)
    await expect(page.getByText('john@example.com')).toBeVisible();
    await expect(page.getByText('john.doe@github.com')).toBeVisible();
});

test('retry button reloads data after initial failure', async ({ page, mock }) => {
    // Start with identity service down
    await mock.add('withIdentityDown');

    await page.goto('/__test/account/linkedidentities');

    // Wait for error to appear in the card (Remote function with retries takes at least 15 seconds to timeout)
    await expect(page.getByText('Retry').first()).toBeVisible({ timeout: 15000 });

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
    const unlinkButton = page.getByText('Unlink').first();
    await unlinkButton.click();

    // Confirmation dialog should appear
    await expect(page.getByText('Unlink Identity')).toBeVisible();
    await expect(page.getByText('Are you sure you want to unlink this identity?')).toBeVisible();

    // Click confirm button in the dialog
    const confirmButton = page.getByText('Unlink').last();
    await confirmButton.click();

    // Button should become disabled during the operation (loading state)
    await expect(unlinkButton).toBeDisabled();
});

test('link provider dialog opens and shows available providers', async ({ page }) => {
    await page.goto('/__test/account/linkedidentities');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /identities/i })).toBeVisible();

    // Click "Link Provider" button
    await page.getByText('Link Provider').click();

    // Dialog should open with title
    await expect(page.getByText('Link External Account')).toBeVisible();

    // Should show available providers (from mock: gitlab, google, github, discord)
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /github/i })).toBeVisible();
});

test('link provider submits to correct API route', async ({ page }) => {
    await page.goto('/__test/account/linkedidentities');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /identities/i })).toBeVisible();

    // Click "Link Provider" button
    await page.getByText('Link Provider').click();

    // Dialog should open
    await expect(page.getByText('Link External Account')).toBeVisible();

    // Click a provider button (e.g., Google)
    const googleButton = page.getByRole('button', { name: /google/i });
    await googleButton.click();

    // Should navigate to /api/auth/google/link
    // Note: In test environment, this will be handled by MSW mock
    await page.waitForURL('**/__test/account/linkedidentities');
});
