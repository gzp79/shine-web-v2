import { expect, test } from '../../fixtures/mock';
import { RequestGate } from '../../helpers/request-gate';

test('revoke token: confirm dialog and in-flight state', async ({ page }) => {
    await page.goto('/account');
    await expect(page.getByText('hash-token-1')).toBeVisible();

    const revokeButton = page.getByText('Revoke').first();

    await test.step('open confirmation dialog', async () => {
        await revokeButton.click();
        await expect(page.getByRole('heading', { name: 'Revoke Token' }).first()).toBeVisible();
        await expect(page.getByText('Are you sure you want to revoke this token?')).toBeVisible();
    });

    await test.step('confirm revoke and observe held loading state', async () => {
        const gate = await RequestGate.forRemote(page, 'revokeToken');

        const confirmButton = page
            .getByRole('dialog', { name: 'Revoke Token' })
            .getByRole('button', { name: 'Revoke' });
        await confirmButton.click();

        await gate.hold();
        await expect(revokeButton).toBeDisabled();

        gate.release();
        await expect(revokeButton).toBeEnabled();

        await gate.dispose();
    });
});

test('revoke token: failure shows error then recovers after retry', async ({ page, mock }) => {
    await mock.add('revokeTokenFailure');
    await page.goto('/account');
    await expect(page.getByText('hash-token-1')).toBeVisible();

    const revokeButton = page.getByText('Revoke').first();

    await test.step('trigger revoke failure', async () => {
        await revokeButton.click();
        await expect(page.getByRole('heading', { name: 'Revoke Token' }).first()).toBeVisible();

        await page.getByRole('dialog', { name: 'Revoke Token' }).getByRole('button', { name: 'Revoke' }).click();
    });

    await test.step('error shown, recover after retry', async () => {
        await expect(page.getByText('Retry').first()).toBeVisible();

        await mock.remove('revokeTokenFailure');
        await page.getByText('Retry').first().click();

        await expect(page.getByText('hash-token-1')).toBeVisible();
        await expect(revokeButton).toBeEnabled();
    });
});

test('unlink identity: confirm dialog and in-flight state', async ({ page }) => {
    await page.goto('/account');
    await expect(page.getByText('john@example.com')).toBeVisible();

    const unlinkButton = page.getByText('Unlink').first();

    await test.step('open confirmation dialog', async () => {
        await unlinkButton.click();
        await expect(page.getByRole('heading', { name: 'Unlink Identity' }).first()).toBeVisible();
        await expect(page.getByText('Are you sure you want to unlink this identity?')).toBeVisible();
    });

    await test.step('confirm unlink and observe held loading state', async () => {
        const gate = await RequestGate.forRemote(page, 'unlinkIdentity');

        await page.getByRole('dialog', { name: 'Unlink Identity' }).getByRole('button', { name: 'Unlink' }).click();

        await gate.hold();
        await expect(unlinkButton).toBeDisabled();

        gate.release();
        await expect(unlinkButton).toBeEnabled();

        await gate.dispose();
    });
});
