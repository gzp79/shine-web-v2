import { expect, test } from '../../fixtures/mock';
import { RequestGate } from '../../helpers/request-gate';

test('shows loading state then tokens when authenticated', async ({ page, mock }) => {
    await mock.add('withDelay', { ms: 2000 });

    await test.step('shows loading indicator', async () => {
        await page.goto('/__test/account/activetokens');
        await expect(page.getByText('Loading...')).toBeVisible();
    });

    await test.step('displays token data', async () => {
        await expect(page.getByRole('heading', { name: /active tokens/i })).toBeVisible();
        await expect(page.getByText('hash-token-1')).toBeVisible();
        await expect(page.getByText('hash-token-2')).toBeVisible();
    });
});

test('retry button reloads data after initial failure', async ({ page, mock }) => {
    await mock.add('withIdentityDown');

    await test.step('navigate and see error', async () => {
        await page.goto('/__test/account/activetokens');
        await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
    });

    await test.step('surfaces the underlying cause (non-prod)', async () => {
        // The hook unwraps the retry wrapper, so the real upstream failure is shown, not "Retry limit exceeded".
        const error = page.getByRole('alert');
        await expect(error).toContainText('Failed to get active tokens');
        await expect(error).toContainText('Mocked server is down');
    });

    await test.step('recover after retry', async () => {
        await mock.remove('withIdentityDown');
        await page.getByRole('button', { name: 'Retry' }).click();
        await expect(page.getByText('hash-token-1')).toBeVisible();
    });
});

test('revoke token: confirmation dialog and loading states', async ({ page }) => {
    await page.goto('/__test/account/activetokens');
    await expect(page.getByText('hash-token-1')).toBeVisible();

    const revokeButton = page.getByText('Revoke').first();

    await test.step('open confirmation dialog', async () => {
        await revokeButton.click();
        await expect(page.getByRole('heading', { name: 'Revoke Token' }).first()).toBeVisible();
        await expect(page.getByText('Are you sure you want to revoke this token?')).toBeVisible();
    });

    await test.step('confirm revoke and observe loading', async () => {
        const gate = await RequestGate.forRemote(page, 'revokeToken');

        const confirmButton = page.getByLabel('Revoke Token').getByRole('button', { name: 'Revoke' });
        await confirmButton.click();

        await gate.hold();
        await expect(revokeButton).toBeDisabled();

        gate.release();
        await expect(revokeButton).toBeEnabled();

        await gate.dispose();
    });
});

test('revoke token: failure, error boundary, and retry recovery', async ({ page, mock }) => {
    await mock.add('revokeTokenFailure');
    await page.goto('/__test/account/activetokens');
    await expect(page.getByText('hash-token-1')).toBeVisible();

    const revokeButton = page.getByText('Revoke').first();

    await test.step('trigger revoke failure', async () => {
        await revokeButton.click();
        await expect(page.getByRole('heading', { name: 'Revoke Token' }).first()).toBeVisible();

        const confirmButton = page.getByLabel('Revoke Token').getByRole('button', { name: 'Revoke' });
        await confirmButton.click();
    });

    await test.step('error shown with underlying cause, recover after retry', async () => {
        await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
        await expect(page.getByRole('alert')).toContainText('Failed to revoke token');

        await mock.remove('revokeTokenFailure');
        await page.getByRole('button', { name: 'Retry' }).click();

        await expect(page.getByText('hash-token-1')).toBeVisible();
        await expect(revokeButton).toBeEnabled();
    });
});
