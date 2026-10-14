import guestUser from '../../../src/mocks/data/users/guestUser.json' with { type: 'json' };
import { expect, test } from '../../fixtures/mock';
import { interceptIdentityAuthWithRedirect } from '../../helpers/auth-intercept';

const MOCK_USERNAME = guestUser.name;

test('shows danger zone card with warning text', async ({ page }) => {
    await page.goto('/__test/account/dangerzone');

    await expect(page.getByText('Danger Zone')).toBeVisible();
    await expect(page.getByText('This action is irreversible')).toBeVisible();
});

test('delete button is disabled when input is empty', async ({ page }) => {
    await page.goto('/__test/account/dangerzone');
    await expect(page.getByText('This action is irreversible')).toBeVisible();

    const deleteButton = page.getByRole('button', { name: 'Delete Account' });
    await expect(deleteButton).toBeDisabled();
});

test('delete button is disabled when input does not match username', async ({ page }) => {
    await page.goto('/__test/account/dangerzone');
    await expect(page.getByText('This action is irreversible')).toBeVisible();

    const input = page.getByPlaceholder(MOCK_USERNAME);
    await input.fill('WrongName');

    const deleteButton = page.getByRole('button', { name: 'Delete Account' });
    await expect(deleteButton).toBeDisabled();
});

test('delete button is enabled when input matches username exactly', async ({ page }) => {
    await page.goto('/__test/account/dangerzone');
    await expect(page.getByText('This action is irreversible')).toBeVisible();

    const input = page.getByPlaceholder(MOCK_USERNAME);
    await input.fill(MOCK_USERNAME);

    const deleteButton = page.getByRole('button', { name: 'Delete Account' });
    await expect(deleteButton).toBeEnabled();
});

test('confirmation dialog appears when delete button is clicked', async ({ page }) => {
    await page.goto('/__test/account/dangerzone');
    await expect(page.getByText('This action is irreversible')).toBeVisible();

    const input = page.getByPlaceholder(MOCK_USERNAME);
    await input.fill(MOCK_USERNAME);
    await page.getByRole('button', { name: 'Delete Account' }).click();

    await expect(page.getByText('Delete Account Permanently?')).toBeVisible();
    await expect(page.getByText('This will permanently delete your account')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
});

test('cancel in confirmation dialog closes it without navigating', async ({ page }) => {
    await page.goto('/__test/account/dangerzone');
    await expect(page.getByText('This action is irreversible')).toBeVisible();

    const input = page.getByPlaceholder(MOCK_USERNAME);
    await input.fill(MOCK_USERNAME);
    await page.getByRole('button', { name: 'Delete Account' }).click();

    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByText('Danger Zone')).toBeVisible();
    await expect(page).toHaveURL(/\/__test\/account\/dangerzone/);
});

test('confirm in dialog redirects to account-deleted page', async ({ page }) => {
    await interceptIdentityAuthWithRedirect(page);
    await page.goto('/__test/account/dangerzone');
    await expect(page.getByText('This action is irreversible')).toBeVisible();

    const input = page.getByPlaceholder(MOCK_USERNAME);
    await input.fill(MOCK_USERNAME);
    await page.getByRole('button', { name: 'Delete Account' }).click();

    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(page).toHaveURL(/\/public\/account-deleted/);
});

test('expired session: confirming the delete redirects to login instead of deleting', async ({ page, mock }) => {
    await interceptIdentityAuthWithRedirect(page);
    await page.goto('/__test/account/dangerzone');
    await expect(page.getByText('This action is irreversible')).toBeVisible();

    await page.getByPlaceholder(MOCK_USERNAME).fill(MOCK_USERNAME);
    await page.getByRole('button', { name: 'Delete Account' }).click();
    await expect(page.getByText('Delete Account Permanently?')).toBeVisible();

    // The session dies while the confirmation dialog is open.
    await mock.add('unauthorizedUser');
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    // The last-moment check finds the session gone, so the delete is abandoned and the guard takes
    // over - the user must not land on the account-deleted page for an account that was never
    // deleted.
    await page.waitForURL((url) => url.pathname === '/login');
    expect(new URL(page.url()).searchParams.get('hint')).toBe('login-expired');
});

test('live session: confirming the delete goes through the last-moment check', async ({ page }) => {
    await interceptIdentityAuthWithRedirect(page);
    await page.goto('/__test/account/dangerzone');
    await expect(page.getByText('This action is irreversible')).toBeVisible();

    // The check re-reads the session, so a second user query must be issued before the delete.
    const userFetches: string[] = [];
    page.on('request', (request) => {
        if (new URL(request.url()).pathname.endsWith('/queryCurrentUserInfo')) userFetches.push(request.url());
    });

    await page.getByPlaceholder(MOCK_USERNAME).fill(MOCK_USERNAME);
    await page.getByRole('button', { name: 'Delete Account' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(page).toHaveURL(/\/public\/account-deleted/);
    expect(userFetches.length).toBeGreaterThanOrEqual(1);
});
