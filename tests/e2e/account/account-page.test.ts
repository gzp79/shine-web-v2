import { expect, test } from '../../fixtures/mock';
import { interceptIdentityAuthWithRedirect } from '../../helpers/auth-intercept';

const GUEST_NAME = 'Freshman_k7wxkl';

test('renders the full account page for an authenticated guest', async ({ page }) => {
    await page.goto('/account');

    await test.step('renders the page heading and user info', async () => {
        await expect(page.getByRole('heading', { level: 1, name: 'Account', exact: true })).toBeVisible();
        await expect(page.getByText('User Information')).toBeVisible();
        await expect(page.getByText(GUEST_NAME, { exact: true })).toBeVisible();
        await expect(page.getByText('No email')).toBeVisible();
    });

    await test.step('renders all account cards', async () => {
        await expect(page.getByRole('heading', { name: 'Linked Identities' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Active Sessions' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Active Tokens' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Danger Zone' })).toBeVisible();
    });
});

test('unauthenticated user is redirected to login', async ({ page, mock }) => {
    await mock.add('unauthorizedUser');

    await page.goto('/account');

    await page.waitForURL((url) => url.pathname === '/login');
});

test('logout redirects to bye page', async ({ page }) => {
    await interceptIdentityAuthWithRedirect(page);

    await page.goto('/account');
    await expect(page.getByText(GUEST_NAME, { exact: true })).toBeVisible();

    const logoutLink = page.getByRole('link', { name: 'Logout' });

    await test.step('logout link points to the identity server', async () => {
        const href = await logoutLink.getAttribute('href');
        expect(href).toContain('/identity/auth/logout');
        expect(href).toContain('terminateAll=false');
    });

    await test.step('clicking logout redirects to the bye page', async () => {
        await logoutLink.click();
        await expect(page).toHaveURL(/\/public\/bye/);
    });
});

test('delete account flow redirects to account-deleted', async ({ page }) => {
    await interceptIdentityAuthWithRedirect(page);

    await page.goto('/account');
    await expect(page.getByText('Danger Zone')).toBeVisible();

    await test.step('typing the username enables and triggers the confirm dialog', async () => {
        await page.getByPlaceholder(GUEST_NAME).fill(GUEST_NAME);
        await page.getByRole('button', { name: 'Delete Account' }).click();
        await expect(page.getByText('Delete Account Permanently?')).toBeVisible();
    });

    await test.step('confirming deletion redirects to the account-deleted page', async () => {
        await page.getByRole('link', { name: 'Delete', exact: true }).click();
        await expect(page).toHaveURL(/\/public\/account-deleted/);
    });
});
