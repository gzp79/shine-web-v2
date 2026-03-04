import { expect, test } from '../../fixtures/mock';

/**
 * ActiveTokenCard Integration Tests
 *
 * Test Scope:
 * ✅ API integration (correct endpoints called)
 * ✅ State transitions (loading → success/error)
 * ✅ Error handling and recovery flows
 * ✅ User interactions (dialogs, buttons)
 *
 * Out of Scope:
 * ❌ Data mutations (avoiding parallel logic in mocks)
 * ❌ Backend correctness (tested by backend tests)
 *
 * Note: Mocks return success/failure but don't mutate data.
 * This avoids reimplementing business logic in the test layer.
 */

test('shows loading state then tokens when authenticated', async ({ page, mock }) => {
    // Add delay to simulate slow loading
    await mock.add('withDelay', { ms: 2000 });

    await page.goto('/__test/account/activetokens');

    // Should show loading card immediately
    await expect(page.getByText('Loading...')).toBeVisible();

    // Wait for the card to render with token data
    const card = page.getByRole('heading', { name: /active tokens/i });
    await expect(card).toBeVisible();

    // Verify tokens are displayed (check for token hashes from mock data)
    await expect(page.getByText('hash-token-1')).toBeVisible();
    await expect(page.getByText('hash-token-2')).toBeVisible();
});

test('retry button reloads data after initial failure', async ({ page, mock }) => {
    // Start with identity service down
    await mock.add('withIdentityDown');

    await page.goto('/__test/account/activetokens');

    // Wait for error to appear in the card (Remote function with retries takes at least 15 seconds to timeout)
    await expect(page.getByText('Retry').first()).toBeVisible({ timeout: 15000 });

    // Remove the failure mock to simulate service recovery
    await mock.remove('withIdentityDown');

    // Click retry button
    await page.getByText('Retry').first().click();

    // Should now load successfully
    await expect(page.getByText('hash-token-1')).toBeVisible();
});

test('revoke token handles confirmation dialog and loading states', async ({ page }) => {
    await page.goto('/__test/account/activetokens');

    // Wait for tokens to load
    await expect(page.getByText('hash-token-1')).toBeVisible();

    // Find and click the first revoke button
    const revokeButton = page.getByText('Revoke').first();
    await revokeButton.click();

    // Confirmation dialog should appear
    await expect(page.getByRole('heading', { name: 'Revoke Token' }).first()).toBeVisible();
    await expect(page.getByText('Are you sure you want to revoke this token?')).toBeVisible();

    // Click confirm button in the dialog (find the one inside the dialog by using getByLabel)
    const confirmButton = page.getByLabel('Revoke Token').getByRole('button', { name: 'Revoke' });
    await confirmButton.click();

    // Button should become disabled during the operation (loading state)
    await expect(revokeButton).toBeDisabled();

    // After API call completes, button should return to enabled state
    // Note: Mock API returns success but doesn't mutate data (avoiding parallel logic)
    // Testing state transitions, not data removal
    await expect(revokeButton).toBeEnabled();
});

test('revoke token handles failure, error boundary, and retry flow', async ({ page, mock }) => {
    // Add mock to make revoke fail
    await mock.add('revokeTokenFailure');

    await page.goto('/__test/account/activetokens');

    // Wait for tokens to load
    await expect(page.getByText('hash-token-1')).toBeVisible();

    // Find and click the first revoke button
    const revokeButton = page.getByText('Revoke').first();
    await revokeButton.click();

    // Confirmation dialog should appear
    await expect(page.getByRole('heading', { name: 'Revoke Token' }).first()).toBeVisible();

    // Click confirm button in the dialog (find the one inside the dialog by using getByLabel)
    const confirmButton = page.getByLabel('Revoke Token').getByRole('button', { name: 'Revoke' });
    await confirmButton.click();

    // Wait for error to appear in the card (Remote function with retries takes at least 15 seconds to timeout)
    await expect(page.getByText('Retry').first()).toBeVisible({ timeout: 15000 });

    // Remove the failure mock to simulate service recovery
    await mock.remove('revokeTokenFailure');

    // Click retry button
    await page.getByText('Retry').first().click();

    // After successful retry, UI should recover and buttons should be enabled
    // Note: Testing error recovery flow and state transitions, not data mutations
    await expect(revokeButton).toBeEnabled();
});
