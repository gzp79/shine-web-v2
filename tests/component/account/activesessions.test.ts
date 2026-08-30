import { expect, test } from '../../fixtures/mock';

test('shows loading state then sessions when authenticated', async ({ page, mock }) => {
    await mock.add('withDelay', { ms: 2000 });

    await test.step('shows loading indicator', async () => {
        await page.goto('/__test/account/activesessions');
        await expect(page.getByText('Loading...')).toBeVisible();
    });

    await test.step('displays session data', async () => {
        await expect(page.getByRole('heading', { name: /active sessions/i })).toBeVisible();
        await expect(page.getByText('fp-chrome-windows')).toBeVisible();
        await expect(page.getByText('fp-safari-mac')).toBeVisible();
    });
});

test('retry button reloads data after initial failure', async ({ page, mock }) => {
    await mock.add('withIdentityDown');

    await test.step('navigate and see error', async () => {
        await page.goto('/__test/account/activesessions');
        await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
    });

    await test.step('surfaces the underlying cause (non-prod)', async () => {
        const error = page.getByRole('alert');
        await expect(error).toContainText('Failed to get active sessions');
        await expect(error).toContainText('Mocked server is down');
    });

    await test.step('recover after retry', async () => {
        await mock.remove('withIdentityDown');
        await page.getByRole('button', { name: 'Retry' }).click();
        await expect(page.getByText('fp-chrome-windows')).toBeVisible();
    });
});
