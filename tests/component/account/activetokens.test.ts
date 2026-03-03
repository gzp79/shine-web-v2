import { expect, test } from '../../fixtures/mock';

test('shows active tokens when authenticated', async ({ page }) => {
    // Default MSW state: guest user with mock tokens
    await page.goto('/__test/account/activetokens');

    // Wait for the card to render with token data
    const card = page.getByRole('heading', { name: /active tokens/i });
    await expect(card).toBeVisible();

    // Verify tokens are displayed (check for token hashes from mock data)
    await expect(page.getByText('hash-token-1')).toBeVisible();
    await expect(page.getByText('hash-token-2')).toBeVisible();
});

test('shows loading card while data is loading', async ({ page, mock }) => {
    // Add delay to simulate slow loading
    await mock.add('withDelay', { ms: 2000 });

    await page.goto('/__test/account/activetokens');

    // Should show loading card immediately
    await expect(page.getByText('Loading...')).toBeVisible();

    // After delay, should show token data
    await expect(page.getByText('hash-token-1')).toBeVisible();
});

test('retry button reloads data after initial failure', async ({ page, mock }) => {
    // Start with identity service down
    await mock.add('withIdentityDown');

    await page.goto('/__test/account/activetokens');

    // Wait for error to appear in the card (not SSR 500)
    await expect(page.getByText('Retry').first()).toBeVisible();

    // Remove the failure mock to simulate service recovery
    await mock.remove('withIdentityDown');

    // Click retry button
    await page.getByText('Retry').first().click();

    // Should now load successfully
    await expect(page.getByText('hash-token-1')).toBeVisible();
});

test('revoke token shows confirmation dialog and triggers loading state', async ({ page }) => {
    await page.goto('/__test/account/activetokens');

    // Wait for tokens to load
    await expect(page.getByText('hash-token-1')).toBeVisible();

    // Find and click the first revoke button
    const revokeButton = page.getByText('account.revoke').first();
    await revokeButton.click();

    // Confirmation dialog should appear
    await expect(page.getByText('account.revokeTokenConfirmationTitle')).toBeVisible();
    await expect(page.getByText('account.revokeTokenConfirmationQuestion')).toBeVisible();

    // Click confirm button in the dialog
    const confirmButton = page.getByText('account.revokeTokenConfirmationConfirmText').last();
    await confirmButton.click();

    // Button should become disabled during the operation (loading state)
    await expect(revokeButton).toBeDisabled();
});

test('revoke token handles failure with error display', async ({ page, mock }) => {
    // Add mock to make revoke fail
    await mock.add('revokeTokenFailure');

    await page.goto('/__test/account/activetokens');

    // Wait for tokens to load
    await expect(page.getByText('hash-token-1')).toBeVisible();

    // Find and click the first revoke button
    const revokeButton = page.getByText('account.revoke').first();
    await revokeButton.click();

    // Confirmation dialog should appear
    await expect(page.getByText('account.revokeTokenConfirmationTitle')).toBeVisible();

    // Click confirm button in the dialog
    const confirmButton = page.getByText('account.revokeTokenConfirmationConfirmText').last();
    await confirmButton.click();

    // Should show error message after failure
    // The error boundary should catch and display the error
    await expect(page.getByText('Retry').first()).toBeVisible();
});
