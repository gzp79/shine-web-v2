import { expect, test } from '../../fixtures/mock';

// Captcha-gated controls have no href until a token is obtained (not available
// headlessly), so assert they are attached rather than visible/clickable.
test('renders the sign-in options', async ({ page }) => {
    await page.goto('/login?prompt=true&returnUrl=/account');

    await expect(page.getByRole('heading', { name: 'Sign in to your account' })).toBeVisible();

    await test.step('external provider buttons are present', async () => {
        await expect(page.getByRole('link', { name: 'Google' })).toBeAttached();
        await expect(page.getByRole('link', { name: 'Github' })).toBeAttached();
    });

    await test.step('email, guest and remember-me controls are present', async () => {
        await expect(page.getByText('Email').first()).toBeAttached();
        await expect(page.getByText('Remember me').first()).toBeAttached();
        await expect(
            page
                .getByRole('button', { name: 'Continue as Guest' })
                .or(page.getByRole('link', { name: 'Continue as Guest' }))
        ).toBeAttached();
    });
});
