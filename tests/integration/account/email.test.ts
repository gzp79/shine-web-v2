import { expect, test } from '../../fixtures/mock';
import { RequestGate } from '../../helpers/request-gate';

test('guest user: set email', async ({ page }) => {
    await page.goto('/account');

    await test.step('user data and no email are visible', async () => {
        await expect(page.getByText('Freshman_k7wxkl', { exact: true })).toBeVisible();
        await expect(page.getByText('No email')).toBeVisible();
    });

    const changeButton = page.getByRole('button', { name: 'Change Email', exact: true });

    await test.step('change button opens dialog', async () => {
        await expect(changeButton).toBeVisible();
        await changeButton.click();
        await expect(page.getByRole('heading', { name: 'Change Email' }).first()).toBeVisible();
    });

    const gate = await RequestGate.forRemote(page, 'startEmailChange');

    await test.step('fill and submit, observe progress then confirmation', async () => {
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible();
        await emailInput.fill('newguest@example.com');

        const updateButton = page.getByText('Update');
        await expect(updateButton).toBeEnabled();
        await updateButton.click();

        await gate.hold();
        await expect(page.getByText('Sending change request...')).toBeVisible();
        gate.release();

        await expect(
            page.getByText('Please check your email and click the confirmation link to complete the change.')
        ).toBeVisible();
    });

    await gate.dispose();

    await test.step('dismiss dialog', async () => {
        await page.getByRole('dialog', { name: 'Change Email' }).getByRole('button', { name: 'OK' }).click();
        await expect(page.getByRole('heading', { name: 'Change Email' }).first()).not.toBeVisible();
    });
});

test('verified user: change email', async ({ page, mock }) => {
    await mock.add('verifiedUser');
    await page.goto('/account');

    await test.step('user data and email are visible', async () => {
        await expect(page.getByText('VerifiedUser_abc123', { exact: true })).toBeVisible();
        await expect(page.getByText('verified@example.com')).toBeVisible();
    });

    const changeButton = page.getByRole('button', { name: 'Change Email', exact: true });

    await test.step('change button opens dialog', async () => {
        await expect(changeButton).toBeVisible();
        await changeButton.click();
        await expect(page.getByRole('heading', { name: 'Change Email' }).first()).toBeVisible();
    });

    const gate = await RequestGate.forRemote(page, 'startEmailChange');

    await test.step('fill and submit, observe progress then confirmation', async () => {
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible();
        await emailInput.fill('changed@example.com');

        const updateButton = page.getByText('Update');
        await expect(updateButton).toBeEnabled();
        await updateButton.click();

        await gate.hold();
        await expect(page.getByText('Sending change request...')).toBeVisible();
        gate.release();

        await expect(
            page.getByText('Please check your email and click the confirmation link to complete the change.')
        ).toBeVisible();
    });

    await gate.dispose();

    await test.step('dismiss dialog', async () => {
        await page.getByRole('dialog', { name: 'Change Email' }).getByRole('button', { name: 'OK' }).click();
        await expect(page.getByRole('heading', { name: 'Change Email' }).first()).not.toBeVisible();
    });
});

test('unverified user: confirm email then change is offered', async ({ page, mock }) => {
    await mock.add('unverifiedUser');
    await page.goto('/account');

    await test.step('user data and email are visible', async () => {
        await expect(page.getByText('UnverifiedUser_xyz789', { exact: true })).toBeVisible();
        await expect(page.getByText('unverified@example.com')).toBeVisible();
    });

    const emailCombo = page.locator('[data-slot="combo-button"]').filter({ hasText: 'Confirm Email' });
    const actionButton = page.getByRole('button', { name: 'Confirm Email', exact: true });
    const dropdownTrigger = emailCombo.locator('button[aria-haspopup="menu"]');

    await test.step('combo button shows confirm and change options', async () => {
        await dropdownTrigger.click();
        const portal = page.locator('#popover');
        await expect(portal.getByRole('menuitem', { name: 'Confirm Email' })).toBeVisible();
        await expect(portal.getByRole('menuitem', { name: 'Change Email' })).toBeVisible();
    });

    const gate = await RequestGate.forRemote(page, 'startEmailConfirmation');

    await test.step('select confirm, observe progress then confirmation', async () => {
        const portal = page.locator('#popover');
        await portal.getByRole('menuitem', { name: 'Confirm Email' }).click();
        await actionButton.click();

        await gate.hold();
        await expect(page.getByText('Sending confirmation email...')).toBeVisible();
        gate.release();

        await expect(page.getByText('Please check your email and click the confirmation link.')).toBeVisible();
    });

    await gate.dispose();

    await test.step('dismiss dialog', async () => {
        await page.getByRole('dialog', { name: 'Confirm Email' }).getByRole('button', { name: 'OK' }).click();
        await expect(page.getByRole('heading', { name: 'Confirm Email' }).first()).not.toBeVisible();
    });
});
