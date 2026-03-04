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

    // Wait for error to appear in the card
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

    // After API call completes, button should return to enabled state
    // Note: Mock API returns success but doesn't mutate data (avoiding parallel logic)
    // Testing state transitions, not data removal
    await expect(unlinkButton).toBeEnabled();
});

test('unlink identity handles failure, error boundary, and retry flow', async ({ page, mock }) => {
    await page.goto('/__test/account/linkedidentities');

    // Wait for identities to load
    await expect(page.getByText('john@example.com')).toBeVisible();

    // Find and click the first unlink button
    const unlinkButton = page.getByText('Unlink').first();
    await unlinkButton.click();

    // Confirmation dialog should appear
    await expect(page.getByText('Unlink Identity')).toBeVisible();

    // Add mock to make unlink fail (simulate service going down during operation)
    await mock.add('withIdentityDown');

    // Click confirm button in the dialog
    const confirmButton = page.getByText('Unlink').last();
    await confirmButton.click();

    // Wait for error to appear in the card
    await expect(page.getByText('Retry').first()).toBeVisible();

    // Remove the failure mock to simulate service recovery
    await mock.remove('withIdentityDown');

    // Click retry button
    await page.getByText('Retry').first().click();

    // After successful retry, UI should recover and buttons should be enabled
    // Note: Testing error recovery flow and state transitions, not data mutations
    await expect(unlinkButton).toBeEnabled();
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
    const dialog = page.getByLabel('Link External Account');
    await expect(dialog.getByRole('button', { name: /google/i })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /github/i })).toBeVisible();
});

test('link provider dialog handles failure when loading providers', async ({ page, mock }) => {
    await page.goto('/__test/account/linkedidentities');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /identities/i })).toBeVisible();

    // Add mock to make loading providers fail
    await mock.add('withIdentityDown');

    // Click "Link Provider" button to open dialog
    await page.getByText('Link Provider').click();

    // Dialog should open but fail to load providers
    await expect(page.getByText('Link External Account')).toBeVisible();

    // Error should propagate to parent card, not shown in dialog
    // Wait for error to appear in the parent card with retry button
    await expect(page.getByText('Retry').first()).toBeVisible();

    // Dialog should close when error propagates
    await expect(page.getByText('Link External Account')).not.toBeVisible();

    // Remove the failure mock to simulate service recovery
    await mock.remove('withIdentityDown');

    // Click retry button to recover
    await page.getByText('Retry').first().click();

    // Should return to success state - identities should be visible again
    await expect(page.getByText('john@example.com')).toBeVisible();

    // Link Provider button should be enabled and clickable again
    await page.getByText('Link Provider').click();

    // Dialog should open successfully this time and show providers
    await expect(page.getByText('Link External Account')).toBeVisible();
    const dialog = page.getByLabel('Link External Account');
    await expect(dialog.getByRole('button', { name: /google/i })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /github/i })).toBeVisible();
});
