import guestUser from '../../../src/mocks/data/users/guestUser.json' with { type: 'json' };
import { expect, test } from '../../fixtures/mock';
import { interceptIdentityAuth } from '../../helpers/auth-intercept';

const MOCK_USERNAME = guestUser.name;

test('delete account sends typed confirmation as a query param', async ({ page }) => {
    let deleteUrl: URL | undefined;

    await interceptIdentityAuth(page, (url) => {
        if (url.pathname.includes('/auth/delete')) {
            deleteUrl = url;
            const redirectUrl = url.searchParams.get('redirectUrl');
            if (redirectUrl) return { redirect: redirectUrl };
        }
    });

    await page.goto('/account');

    await test.step('type confirmation and open dialog', async () => {
        const input = page.getByPlaceholder(MOCK_USERNAME);
        await input.fill(MOCK_USERNAME);

        const deleteButton = page.getByRole('button', { name: 'Delete Account' });
        await expect(deleteButton).toBeEnabled();
        await deleteButton.click();

        await expect(page.getByText('Delete Account Permanently?')).toBeVisible();
    });

    await test.step('confirm deletion and verify confirmation query param', async () => {
        await page.getByRole('link', { name: 'Delete', exact: true }).click();

        await page.waitForURL(/\/public\/account-deleted/);

        expect(deleteUrl).toBeDefined();
        expect(deleteUrl!.searchParams.get('confirmation')).toBe(MOCK_USERNAME);
    });
});
