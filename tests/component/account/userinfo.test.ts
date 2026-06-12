import { expect, test } from '../../fixtures/mock';
import { interceptIdentityAuthWithError, interceptIdentityAuthWithRedirect } from '../../helpers/auth-intercept';
import { clickComboAction } from '../../helpers/interactions';
import { RequestGate } from '../../helpers/request-gate';

test('shows loading state then user info when authenticated', async ({ page, mock }) => {
    await mock.add('withDelay', { ms: 2000 });

    await page.goto('/__test/account/userinfo');
    await expect(page.getByText('Loading...')).toBeVisible();
    const card = page.locator('[data-testid="user-info-card"]').or(page.getByText('Freshman'));
    await expect(card.first()).toBeVisible();
});

test('retry button reloads data after initial failure', async ({ page, mock }) => {
    await mock.add('withIdentityDown');

    await page.goto('/__test/account/userinfo');
    await expect(page.getByText('Retry').first()).toBeVisible();

    await mock.remove('withIdentityDown');

    await page.getByText('Retry').first().click();
    await expect(page.getByText('Freshman')).toBeVisible();
});

test('verified user: change email flow', async ({ page, mock }) => {
    await mock.add('verifiedUser');
    await page.goto('/__test/account/userinfo');

    await test.step('user data and email are visible', async () => {
        await expect(page.getByText('VerifiedUser_abc123')).toBeVisible();
        await expect(page.getByText('verified@example.com')).toBeVisible();
    });

    const emailSection = page.locator('text=Email').locator('..');
    const changeButton = emailSection.getByRole('button').first();

    await test.step('change button opens dialog', async () => {
        await expect(changeButton).toContainText('Change Email');
        await changeButton.click();
        await expect(page.getByRole('heading', { name: 'Change Email' }).first()).toBeVisible();
    });

    const gate = await RequestGate.forRemote(page, 'startEmailChange');

    await test.step('fill and submit email change', async () => {
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible();
        await emailInput.fill('newemail@example.com');

        const updateButton = page.getByText('Update');
        await expect(updateButton).toBeEnabled();
        await updateButton.click();
    });

    await test.step('shows progress then confirmation', async () => {
        await gate.hold();
        await expect(page.getByText('Sending change request...')).toBeVisible();

        gate.release();
        await expect(
            page.getByText('Please check your email and click the confirmation link to complete the change.')
        ).toBeVisible();
    });

    await gate.dispose();

    await test.step('dismiss dialog and recover', async () => {
        await page.getByRole('button', { name: 'OK' }).click();
        await expect(page.getByRole('heading', { name: 'Change Email' }).first()).not.toBeVisible();
        await expect(changeButton).toBeEnabled();
    });
});

test('guest user: change email flow', async ({ page }) => {
    await page.goto('/__test/account/userinfo');

    await test.step('shows no email and change button', async () => {
        await expect(page.getByText('Freshman')).toBeVisible();
        await expect(page.getByText('No email')).toBeVisible();
    });

    const emailSection = page.locator('text=Email').locator('..');
    const changeButton = emailSection.getByRole('button').first();

    await test.step('change button opens dialog', async () => {
        await expect(changeButton).toContainText('Change Email');
        await changeButton.click();
        await expect(page.getByRole('heading', { name: 'Change Email' }).first()).toBeVisible();
    });

    const gate = await RequestGate.forRemote(page, 'startEmailChange');

    await test.step('fill and submit email change', async () => {
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible();
        await emailInput.fill('newemail@example.com');

        const updateButton = page.getByText('Update');
        await expect(updateButton).toBeEnabled();
        await updateButton.click();
    });

    await test.step('shows progress then confirmation', async () => {
        await gate.hold();
        await expect(page.getByText('Sending change request...')).toBeVisible();

        gate.release();
        await expect(
            page.getByText('Please check your email and click the confirmation link to complete the change.')
        ).toBeVisible();
    });

    await gate.dispose();

    await test.step('dismiss dialog and recover', async () => {
        await page.getByRole('button', { name: 'OK' }).click();
        await expect(page.getByRole('heading', { name: 'Change Email' }).first()).not.toBeVisible();
        await expect(changeButton).toBeEnabled();
    });
});

test('unverified user: confirm email flow', async ({ page, mock }) => {
    await mock.add('unverifiedUser');
    await page.goto('/__test/account/userinfo');

    await test.step('user data and email are visible', async () => {
        await expect(page.getByText('UnverifiedUser_xyz789')).toBeVisible();
        await expect(page.getByText('unverified@example.com')).toBeVisible();
    });

    const emailSection = page.locator('text=Email').locator('..');
    const actionButton = emailSection.locator('button').first();
    const dropdownTrigger = emailSection.locator('button').nth(1);

    await test.step('combo button shows confirm and change options', async () => {
        await dropdownTrigger.click();
        const portal = page.locator('#popover');
        await expect(portal.getByRole('menuitem', { name: 'Confirm Email' })).toBeVisible();
        await expect(portal.getByRole('menuitem', { name: 'Change Email' })).toBeVisible();
    });

    const gate = await RequestGate.forRemote(page, 'startEmailConfirmation');

    await test.step('select confirm and trigger action', async () => {
        const portal = page.locator('#popover');
        await portal.getByRole('menuitem', { name: 'Confirm Email' }).click();
        await actionButton.click();
    });

    await test.step('shows progress then confirmation', async () => {
        await gate.hold();
        await expect(page.getByText('Sending confirmation email...')).toBeVisible();

        gate.release();
        await expect(page.getByText('Please check your email and click the confirmation link.')).toBeVisible();
    });

    await gate.dispose();

    await test.step('dismiss dialog and recover', async () => {
        await page.getByRole('button', { name: 'OK' }).click();
        await expect(page.getByRole('heading', { name: 'Confirm Email' }).first()).not.toBeVisible();
        await expect(actionButton).toBeEnabled();
    });
});

test('change email dialog validates invalid email input', async ({ page }) => {
    await page.goto('/__test/account/userinfo');
    await expect(page.getByText('Freshman')).toBeVisible();

    const changeButton = page.getByRole('button', { name: 'Change Email' });
    await changeButton.click();
    await expect(page.getByRole('heading', { name: 'Change Email' }).first()).toBeVisible();

    const emailInput = page.locator('input[type="email"]');
    const updateButton = page.getByText('Update');

    await emailInput.fill('invalid-email');
    await expect(updateButton).toBeDisabled();

    await emailInput.fill('valid@example.com');
    await expect(updateButton).toBeEnabled();
});

test('change email handles failure and recovers after retry', async ({ page, mock }) => {
    await page.goto('/__test/account/userinfo');
    await expect(page.getByText('Freshman')).toBeVisible();

    const changeButton = page.getByRole('button', { name: 'Change Email' });

    await test.step('open dialog and submit', async () => {
        await changeButton.click();
        await expect(page.getByRole('heading', { name: 'Change Email' }).first()).toBeVisible();

        await page.locator('input[type="email"]').fill('newemail@example.com');
        await mock.add('withIdentityDown');
        await page.getByText('Update').click();
    });

    await test.step('shows failure and retry recovers', async () => {
        await expect(page.getByText('Sending change request...')).toBeVisible();
        await expect(page.getByText('Retry').first()).toBeVisible();

        await mock.remove('withIdentityDown');
        await page.getByText('Retry').first().click();
    });

    await test.step('UI recovers to normal state', async () => {
        await expect(page.getByText('Freshman')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Change Email' }).first()).not.toBeVisible();
        await expect(changeButton).toBeEnabled();
    });
});

test('logout button click redirects to bye page', async ({ page }) => {
    await interceptIdentityAuthWithRedirect(page);
    await page.goto('/__test/account/userinfo');
    await expect(page.getByText('Freshman')).toBeVisible();

    const logoutButton = page.getByRole('link', { name: 'Logout' });
    await expect(logoutButton).toBeVisible();

    await test.step('href points to identity server', async () => {
        const href = await logoutButton.getAttribute('href');
        expect(href).toContain('/identity/auth/logout');
        expect(href).toContain('terminateAll=false');
    });

    await logoutButton.click();
    await expect(page).toHaveURL(/\/public\/bye/);
});

test('logout all button click redirects to bye page', async ({ page }) => {
    await interceptIdentityAuthWithRedirect(page);
    await page.goto('/__test/account/userinfo');
    await expect(page.getByText('Freshman')).toBeVisible();

    await clickComboAction(page.locator('body'), 'Logout from all devices');
    await expect(page).toHaveURL(/\/public\/bye/);
});

test('logout button points to identity server when server is down', async ({ page }) => {
    await interceptIdentityAuthWithError(page);
    await page.goto('/__test/account/userinfo');
    await expect(page.getByText('Freshman')).toBeVisible();

    const href = await page.getByRole('link', { name: 'Logout' }).getAttribute('href');
    expect(href).toContain('/identity/auth/logout');
    expect(href).toContain('redirectUrl=');
});
