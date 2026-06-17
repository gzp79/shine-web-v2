import { expect, test } from '../../fixtures/mock';
import { interceptIdentityAuthWithError, interceptIdentityAuthWithRedirect } from '../../helpers/auth-intercept';

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

test('unauthenticated user is redirected to login with returnUrl', async ({ page, mock }) => {
    await mock.add('unauthorizedUser');

    await page.goto('/account');

    await page.waitForURL((url) => url.pathname === '/login');
    expect(new URL(page.url()).searchParams.get('returnUrl')).toBe('/account');
});

test('unauthenticated user is redirected again after pressing Back', async ({ page, mock }) => {
    await interceptIdentityAuthWithRedirect(page);

    // First visit as authenticated, then session expires
    await page.goto('/account');
    await expect(page.getByRole('heading', { level: 1, name: 'Account', exact: true })).toBeVisible();

    await mock.add('unauthorizedUser');
    await page.goBack();
    // Now on a previous page; navigate back to the guarded route
    await page.goto('/account');

    await page.waitForURL((url) => url.pathname === '/login');
    expect(new URL(page.url()).searchParams.get('returnUrl')).toBe('/account');
});

test('linked user: logout redirects to bye page', async ({ page, mock }) => {
    await mock.add('verifiedUser');
    await interceptIdentityAuthWithRedirect(page);

    await page.goto('/account');
    await expect(page.getByText('VerifiedUser_abc123', { exact: true })).toBeVisible();

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

test('linked user: logout surfaces the identity server error when it is down', async ({ page, mock }) => {
    await mock.add('verifiedUser');
    await interceptIdentityAuthWithError(page);

    await page.goto('/account');
    await expect(page.getByText('VerifiedUser_abc123', { exact: true })).toBeVisible();

    await page.getByRole('link', { name: 'Logout' }).click();

    // The logout link navigates straight to the identity server, so a downed
    // server leaves the user on its error response rather than the bye page.
    await expect(page).toHaveURL(/\/identity\/auth\/logout/);
    await expect(page.getByText('Service unavailable')).toBeVisible();
    await expect(page).not.toHaveURL(/\/public\/bye/);
});

test('guest user: logout shows data-loss warning before redirecting', async ({ page }) => {
    await interceptIdentityAuthWithRedirect(page);

    await page.goto('/account');
    await expect(page.getByText(GUEST_NAME, { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Logout', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Logout without a saved account?' }).first()).toBeVisible();
    await expect(page.getByText('you will permanently lose access')).toBeVisible();

    const confirmLink = page.getByRole('link', { name: 'Logout anyway' });
    expect(await confirmLink.getAttribute('href')).toContain('/identity/auth/logout');

    await confirmLink.click();
    await expect(page).toHaveURL(/\/public\/bye/);
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
