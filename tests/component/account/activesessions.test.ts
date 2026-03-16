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
        await expect(page.getByText('Retry').first()).toBeVisible();
    });

    await test.step('recover after retry', async () => {
        await mock.remove('withIdentityDown');
        await page.getByText('Retry').first().click();
        await expect(page.getByText('fp-chrome-windows')).toBeVisible();
    });
});
