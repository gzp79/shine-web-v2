import { expect, test } from '../../fixtures/mock';

test('shows loading state then identities when authenticated', async ({ page, mock }) => {
    await mock.add('withDelay', { ms: 2000 });

    await test.step('shows loading indicator', async () => {
        await page.goto('/__test/account/linkedidentities');
        await expect(page.getByText('Loading...')).toBeVisible();
    });

    await test.step('displays identity data', async () => {
        await expect(page.getByRole('heading', { name: /identities/i })).toBeVisible();
        await expect(page.getByText('john@example.com')).toBeVisible();
        await expect(page.getByText('john.doe@github.com')).toBeVisible();
    });
});

test('retry button reloads data after initial failure', async ({ page, mock }) => {
    await mock.add('withIdentityDown');

    await test.step('navigate and see error', async () => {
        await page.goto('/__test/account/linkedidentities');
        await expect(page.getByText('Retry').first()).toBeVisible();
    });

    await test.step('recover after retry', async () => {
        await mock.remove('withIdentityDown');
        await page.getByText('Retry').first().click();
        await expect(page.getByText('john@example.com')).toBeVisible();
    });
});

test('unlink identity: confirmation dialog and loading states', async ({ page }) => {
    await page.goto('/__test/account/linkedidentities');
    await expect(page.getByText('john@example.com')).toBeVisible();

    const unlinkButton = page.getByText('Unlink').first();

    await test.step('open confirmation dialog', async () => {
        await unlinkButton.click();
        await expect(page.getByText('Unlink Identity')).toBeVisible();
        await expect(page.getByText('Are you sure you want to unlink this identity?')).toBeVisible();
    });

    await test.step('confirm unlink and observe loading', async () => {
        await page.getByText('Unlink').last().click();
        await expect(unlinkButton).toBeDisabled();
        await expect(unlinkButton).toBeEnabled();
    });
});

test('unlink identity: failure, error boundary, and retry recovery', async ({ page, mock }) => {
    await page.goto('/__test/account/linkedidentities');
    await expect(page.getByText('john@example.com')).toBeVisible();

    const unlinkButton = page.getByText('Unlink').first();

    await test.step('trigger unlink failure', async () => {
        await unlinkButton.click();
        await expect(page.getByText('Unlink Identity')).toBeVisible();

        await mock.add('withIdentityDown');
        await page.getByText('Unlink').last().click();
    });

    await test.step('error shown, recover after retry', async () => {
        await expect(page.getByText('Retry').first()).toBeVisible();

        await mock.remove('withIdentityDown');
        await page.getByText('Retry').first().click();

        await expect(unlinkButton).toBeEnabled();
    });
});

test('link provider dialog opens and shows available providers', async ({ page }) => {
    await page.goto('/__test/account/linkedidentities');
    await expect(page.getByRole('heading', { name: /identities/i })).toBeVisible();

    await test.step('open dialog', async () => {
        await page.getByText('Link Provider').click();
        await expect(page.getByText('Link External Account')).toBeVisible();
    });

    await test.step('shows available providers', async () => {
        const dialog = page.getByLabel('Link External Account');
        await expect(dialog.getByRole('link', { name: /google/i })).toBeVisible();
        await expect(dialog.getByRole('link', { name: /github/i })).toBeVisible();
    });
});

test('link provider dialog: failure loading providers and retry recovery', async ({ page, mock }) => {
    await mock.add('withIdentityDown');

    await test.step('navigate and see error', async () => {
        await page.goto('/__test/account/linkedidentities');
        await expect(page.getByText('Retry').first()).toBeVisible();
    });

    await test.step('recover and verify dialog works', async () => {
        await mock.remove('withIdentityDown');
        await page.getByText('Retry').first().click();
        await expect(page.getByText('john@example.com')).toBeVisible();

        await page.getByText('Link Provider').click();
        await expect(page.getByText('Link External Account')).toBeVisible();
        const dialog = page.getByLabel('Link External Account');
        await expect(dialog.getByRole('link', { name: /google/i })).toBeVisible();
        await expect(dialog.getByRole('link', { name: /github/i })).toBeVisible();
    });
});
