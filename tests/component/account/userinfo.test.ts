import { expect, test } from '../../fixtures/mock';
import { clickComboAction } from '../../helpers/interactions';

test('shows loading state then user info when authenticated', async ({ page, mock }) => {
    // Add delay to simulate slow loading
    await mock.add('withDelay', { ms: 2000 });

    await page.goto('/__test/account/userinfo');

    // Should show loading card immediately
    await expect(page.getByText('Loading...')).toBeVisible();

    // Wait for the card to render with user data
    const card = page.locator('[data-testid="user-info-card"]').or(page.getByText('Freshman'));
    await expect(card.first()).toBeVisible();
});

test('retry button reloads data after initial failure', async ({ page, mock }) => {
    // Start with identity service down
    await mock.add('withIdentityDown');

    await page.goto('/__test/account/userinfo');

    // Wait for error to appear in the card
    await expect(page.getByText('Retry').first()).toBeVisible();

    // Remove the failure mock to simulate service recovery
    await mock.remove('withIdentityDown');

    // Click retry button
    await page.getByText('Retry').first().click();

    // Should now load successfully
    await expect(page.getByText('Freshman')).toBeVisible();
});

test('verified user email button availability and change email flow', async ({ page, mock }) => {
    // Use verified user (has email and it's confirmed)
    await mock.add('verifiedUser');

    await page.goto('/__test/account/userinfo');

    // Wait for user data
    await expect(page.getByText('VerifiedUser_abc123')).toBeVisible();

    // Should show email address
    await expect(page.getByText('verified@example.com')).toBeVisible();

    // Should have single "Change" button (variant='change')
    const emailSection = page.locator('text=Email').locator('..');
    const changeButton = emailSection.getByRole('button').first();
    await expect(changeButton).toContainText('Change Email');

    // Click change button to test the flow
    await changeButton.click();

    // Dialog should open
    await expect(page.getByRole('heading', { name: 'Change Email' }).first()).toBeVisible();

    // Should have email input field
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // Enter new email
    await emailInput.fill('newemail@example.com');

    // Update button should be enabled
    const updateButton = page.getByText('Update');
    await expect(updateButton).toBeEnabled();

    // Click update (would trigger email change flow)
    await updateButton.click();

    // Should show waiting state
    await expect(page.getByText('Sending change request...')).toBeVisible();

    // After API call completes, should show completion message
    await expect(
        page.getByText('Please check your email and click the confirmation link to complete the change.')
    ).toBeVisible();

    // Click OK to close the dialog
    const okButton = page.getByRole('button', { name: 'OK' });
    await okButton.click();

    // Dialog should close and button should return to enabled state
    // Note: Mock API returns success but doesn't mutate data (avoiding parallel logic)
    // Testing state transitions and UI recovery
    await expect(page.getByRole('heading', { name: 'Change Email' }).first()).not.toBeVisible();
    await expect(changeButton).toBeEnabled();
});

test('guest user email button availability and change email flow', async ({ page }) => {
    // Default state is guest user (no email)
    await page.goto('/__test/account/userinfo');

    // Wait for card to load
    await expect(page.getByText('Freshman')).toBeVisible();

    // Should show "No Email" text
    await expect(page.getByText('No email')).toBeVisible();

    // Should have single "Change" button (variant='change')
    const emailSection = page.locator('text=Email').locator('..');
    const changeButton = emailSection.getByRole('button').first();
    await expect(changeButton).toContainText('Change Email');

    // Click change button to test the flow
    await changeButton.click();

    // Dialog should open
    await expect(page.getByRole('heading', { name: 'Change Email' }).first()).toBeVisible();

    // Should have email input field
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // Enter new email
    await emailInput.fill('newemail@example.com');

    // Update button should be enabled
    const updateButton = page.getByText('Update');
    await expect(updateButton).toBeEnabled();

    // Click update (would trigger email change flow)
    await updateButton.click();

    // Should show waiting state
    await expect(page.getByText('Sending change request...')).toBeVisible();

    // After API call completes, should show completion message
    await expect(
        page.getByText('Please check your email and click the confirmation link to complete the change.')
    ).toBeVisible();

    // Click OK to close the dialog
    const okButton = page.getByRole('button', { name: 'OK' });
    await okButton.click();

    // Dialog should close and button should return to enabled state
    // Note: Mock API returns success but doesn't mutate data (avoiding parallel logic)
    // Testing state transitions and UI recovery
    await expect(page.getByRole('heading', { name: 'Change Email' }).first()).not.toBeVisible();
    await expect(changeButton).toBeEnabled();
});

test('unverified user email button availability and confirm email flow', async ({ page, mock }) => {
    // Use unverified user (has email but not confirmed)
    await mock.add('unverifiedUser');

    await page.goto('/__test/account/userinfo');

    // Wait for user data
    await expect(page.getByText('UnverifiedUser_xyz789')).toBeVisible();

    // Should show email address
    await expect(page.getByText('unverified@example.com')).toBeVisible();

    // Should have combo button with both "Confirm" and "Change" options
    const emailSection = page.locator('text=Email').locator('..');
    const actionButton = emailSection.locator('button').first(); // First button is the action button
    const dropdownTrigger = emailSection.locator('button').nth(1); // Second button is the dropdown trigger

    // Click dropdown trigger to open menu
    await dropdownTrigger.click();

    // Should show both options (in dropdown menu portal)
    const portal = page.locator('#popover');
    await expect(portal.getByRole('menuitem', { name: 'Confirm Email' })).toBeVisible();
    await expect(portal.getByRole('menuitem', { name: 'Change Email' })).toBeVisible();

    // Click confirm option to select it
    await portal.getByRole('menuitem', { name: 'Confirm Email' }).click();
    await actionButton.click();

    // Dialog should open with waiting state immediately (confirm starts async operation immediately)
    await expect(page.getByText('Sending confirmation email...')).toBeVisible();

    // After API call completes, should show completion message
    await expect(page.getByText('Please check your email and click the confirmation link.')).toBeVisible();

    // Click OK to close the dialog
    const okButton = page.getByRole('button', { name: 'OK' });
    await okButton.click();

    // Dialog should close and service should return to success state
    // Note: Mock API returns success but doesn't mutate data (avoiding parallel logic)
    // Testing state transitions and UI recovery
    await expect(page.getByRole('heading', { name: 'Confirm Email' }).first()).not.toBeVisible();
    await expect(actionButton).toBeEnabled();
});

test('change email dialog validates invalid email input', async ({ page }) => {
    await page.goto('/__test/account/userinfo');

    // Wait for card to load
    await expect(page.getByText('Freshman')).toBeVisible();

    // Click change button
    const changeButton = page.getByRole('button', { name: 'Change Email' });
    await changeButton.click();

    // Dialog should open
    await expect(page.getByRole('heading', { name: 'Change Email' }).first()).toBeVisible();

    // Enter invalid email
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invalid-email');

    // Update button should be disabled for invalid email
    const updateButton = page.getByText('Update');
    await expect(updateButton).toBeDisabled();

    // Enter valid email
    await emailInput.fill('valid@example.com');

    // Update button should now be enabled
    await expect(updateButton).toBeEnabled();
});

test('change email handles failure in dialog', async ({ page, mock }) => {
    await page.goto('/__test/account/userinfo');

    // Wait for card to load
    await expect(page.getByText('Freshman')).toBeVisible();

    // Click change button
    const changeButton = page.getByRole('button', { name: 'Change Email' });
    await changeButton.click();

    // Dialog should open
    await expect(page.getByRole('heading', { name: 'Change Email' }).first()).toBeVisible();

    // Enter new email
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('newemail@example.com');

    // Add mock to make email change fail (simulate service going down during operation)
    await mock.add('withIdentityDown');

    // Click update button
    const updateButton = page.getByText('Update');
    await updateButton.click();

    // Should show waiting state
    await expect(page.getByText('Sending change request...')).toBeVisible();

    // Wait for error to appear in the card
    await expect(page.getByText('Retry').first()).toBeVisible();

    // Remove the failure mock to simulate service recovery
    await mock.remove('withIdentityDown');

    // Click retry button
    await page.getByText('Retry').first().click();

    // After successful retry, UI should recover to success state
    await expect(page.getByText('Freshman')).toBeVisible();

    // Dialog should be closed
    await expect(page.getByRole('heading', { name: 'Change Email' }).first()).not.toBeVisible();

    // Button should be enabled
    await expect(changeButton).toBeEnabled();
});

test('logout button click redirects to bye page', async ({ page, mock }) => {
    // Add logout mock handler
    await mock.add('defaultLogout');

    await page.goto('/__test/account/userinfo');

    // Wait for card to load
    await expect(page.getByText('Freshman')).toBeVisible();

    // Find the logout link button (ComboButton with href renders as link)
    const logoutButton = page.getByRole('link', { name: 'Logout' });
    await expect(logoutButton).toBeVisible();

    // Click logout button
    await logoutButton.click();

    // Should redirect to bye page
    await expect(page).toHaveURL('/public/bye');
});

test('logout all button click redirects to bye page', async ({ page, mock }) => {
    // Add logout mock handler
    await mock.add('defaultLogout');

    await page.goto('/__test/account/userinfo');

    // Wait for card to load
    await expect(page.getByText('Freshman')).toBeVisible();

    // Select and click "Logout from all devices" from the combo button
    await clickComboAction(page.locator('body'), 'Logout from all devices');

    // Should redirect to bye page
    await expect(page).toHaveURL('/public/bye');
});

test('logout succeeds even when server is down', async ({ page, mock }) => {
    // Add logout failure mock - server returns 503
    await mock.add('logoutFailure');

    await page.goto('/__test/account/userinfo');

    // Wait for card to load
    await expect(page.getByText('Freshman')).toBeVisible();

    // Click logout button
    const logoutButton = page.getByRole('link', { name: 'Logout' });
    await logoutButton.click();

    // Should still redirect to bye page (logout always succeeds client-side)
    await expect(page).toHaveURL('/public/bye');
});
