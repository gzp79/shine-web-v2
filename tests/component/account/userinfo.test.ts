import { expect, test } from '../../fixtures/mock';

test('shows user info when authenticated as guest', async ({ page }) => {
    // Default MSW state: guest user authenticated
    await page.goto('/__test/account/userinfo');

    // Wait for the card to render with user data
    const card = page.locator('[data-testid="user-info-card"]').or(page.getByText('Freshman'));
    await expect(card.first()).toBeVisible();
});

test('shows loading card while data is loading', async ({ page, mock }) => {
    // Add delay to simulate slow loading
    await mock.add('withDelay', { ms: 2000 });

    await page.goto('/__test/account/userinfo');

    // Should show loading card immediately
    await expect(page.getByText('Loading...')).toBeVisible();

    // After delay, should show user data
    await expect(page.getByText('Freshman')).toBeVisible();
});

test('retry button reloads data after initial failure', async ({ page, mock }) => {
    // Start with identity service down
    await mock.add('withIdentityDown');

    await page.goto('/__test/account/userinfo');

    // Wait for error to appear in the card (not SSR 500)
    await expect(page.getByText('Retry').first()).toBeVisible();

    // Remove the failure mock to simulate service recovery
    await mock.remove('withIdentityDown');

    // Click retry button
    await page.getByText('Retry').first().click();

    // Should now load successfully
    await expect(page.getByText('Freshman')).toBeVisible();
});

test('guest user shows only "change" email button', async ({ page }) => {
    // Default state is guest user (no email)
    await page.goto('/__test/account/userinfo');

    // Wait for card to load
    await expect(page.getByText('Freshman')).toBeVisible();

    // Should show "No Email" text
    await expect(page.getByText('account.noEmail')).toBeVisible();

    // Should have single "Change" button (variant='change')
    const emailSection = page.locator('text=account.email').locator('..');
    await expect(emailSection.getByRole('button')).toContainText('account.emailChangeTitle');
});

test('non-guest user without email confirmation shows "confirm or change" button', async ({ page, mock }) => {
    // Use unverified user (has email but not confirmed)
    await mock.add('unverifiedUser');

    await page.goto('/__test/account/userinfo');

    // Wait for user data
    await expect(page.getByText('UnverifiedUser_xyz789')).toBeVisible();

    // Should show email address
    await expect(page.getByText('unverified@example.com')).toBeVisible();

    // Should have combo button with both "Confirm" and "Change" options
    const emailSection = page.locator('text=account.email').locator('..');
    const comboButton = emailSection.locator('button').first();

    // Click to open menu
    await comboButton.click();

    // Should show both options
    await expect(page.getByText('account.emailConfirmTitle')).toBeVisible();
    await expect(page.getByText('account.emailChangeTitle')).toBeVisible();
});

test('non-guest user with verified email shows only "change" button', async ({ page, mock }) => {
    // Use verified user (has email and it's confirmed)
    await mock.add('verifiedUser');

    await page.goto('/__test/account/userinfo');

    // Wait for user data
    await expect(page.getByText('VerifiedUser_abc123')).toBeVisible();

    // Should show email address
    await expect(page.getByText('verified@example.com')).toBeVisible();

    // Should have single "Change" button (variant='change')
    const emailSection = page.locator('text=account.email').locator('..');
    await expect(emailSection.getByRole('button')).toContainText('account.emailChangeTitle');
});

test('change email dialog flow for guest user', async ({ page }) => {
    await page.goto('/__test/account/userinfo');

    // Wait for card to load
    await expect(page.getByText('Freshman')).toBeVisible();

    // Click change button
    await page.getByText('account.emailChangeTitle').click();

    // Dialog should open
    await expect(page.getByText('account.emailChangeTitle')).toBeVisible();

    // Should have email input field
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // Enter new email
    await emailInput.fill('newemail@example.com');

    // Update button should be enabled
    const updateButton = page.getByText('common.update');
    await expect(updateButton).toBeEnabled();

    // Click update (would trigger email change flow)
    await updateButton.click();

    // Should show waiting state
    await expect(page.getByText('account.emailChangeWaiting')).toBeVisible();
});

test('confirm email dialog flow for unverified user', async ({ page, mock }) => {
    await mock.add('unverifiedUser');
    await page.goto('/__test/account/userinfo');

    // Wait for user data
    await expect(page.getByText('UnverifiedUser_xyz789')).toBeVisible();

    // Open combo button menu
    const emailSection = page.locator('text=account.email').locator('..');
    await emailSection.locator('button').first().click();

    // Click confirm option
    await page.getByText('account.emailConfirmTitle').first().click();

    // Dialog should open
    await expect(page.getByText('account.emailConfirmTitle')).toBeVisible();

    // Should show confirmation message
    await expect(page.getByText('account.emailConfirmWaiting')).toBeVisible();
});
