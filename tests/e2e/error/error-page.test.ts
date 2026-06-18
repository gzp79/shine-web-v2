import { expect, test } from '../../fixtures/mock';

test('auth-not-confirmed error shows confirmation-related message', async ({ page }) => {
    await page.goto('/error?errorType=auth-not-confirmed');

    await expect(
        page.getByText(
            'The confirmation text was missing or did not match. Please try again and enter the requested confirmation exactly as shown.'
        )
    ).toBeVisible();
});
