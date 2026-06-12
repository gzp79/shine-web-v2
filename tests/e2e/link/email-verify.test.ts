import { expect, test } from '../../fixtures/mock';

test('valid token shows success', async ({ page, mock }) => {
    await mock.add('completeEmailOperationHandler');

    await page.goto('/link/email-verify?token=valid-token-123');

    await expect(page.getByText('Email operation completed successfully!')).toBeVisible();

    const okLink = page.getByRole('link', { name: 'OK' });
    if (await okLink.count()) {
        await expect(okLink).toBeVisible();
    } else {
        await expect(page.getByRole('button', { name: 'OK' })).toBeVisible();
    }
});

test('OK after success navigates to account', async ({ page, mock }) => {
    await mock.add('completeEmailOperationHandler');

    await page.goto('/link/email-verify?token=valid-token-123');

    await test.step('wait for success message', async () => {
        await expect(page.getByText('Email operation completed successfully!')).toBeVisible();
    });

    await test.step('click OK and navigate to account', async () => {
        await page.getByRole('link', { name: 'OK' }).click();
        await expect(page).toHaveURL(/\/account/);
    });
});

test('invalid token shows error', async ({ page, mock }) => {
    await mock.add('completeEmailOperationFailure');

    await page.goto('/link/email-verify?token=bad-token');

    await expect(page.getByText('Something went wrong')).toBeVisible();
    await expect(page.getByText('Email operation completed successfully!')).not.toBeVisible();
});

test('missing token shows error immediately', async ({ page }) => {
    await page.goto('/link/email-verify');

    await expect(page.getByText('Something went wrong')).toBeVisible();
    await expect(page.getByText('Email operation completed successfully!')).not.toBeVisible();
});
