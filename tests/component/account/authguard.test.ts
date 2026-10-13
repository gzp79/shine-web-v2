import { expect, test } from '../../fixtures/mock';
import { simulateTabRefocus } from '../../helpers/page-lifecycle';

const ROUTE = '/__test/authguard';
const GUEST_NAME = 'Freshman_k7wxkl';

test('loading: shows the loading card until the user query settles', async ({ page, mock }) => {
    await mock.add('withDelay', { ms: 2000 });

    await page.goto(ROUTE);

    await expect(page.getByText('Loading...')).toBeVisible();
    await expect(page.getByTestId('guarded-content')).toBeHidden();

    // ...and hands over once the query resolves.
    await expect(page.getByTestId('guarded-content')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Loading...')).toBeHidden();
});

test('authenticated: renders the children with the user on the context', async ({ page }) => {
    await page.goto(ROUTE);

    await expect(page.getByTestId('guarded-content')).toHaveText(`guarded content for ${GUEST_NAME}`);
});

test('unauthenticated: redirects to login with the guarded route as returnUrl', async ({ page, mock }) => {
    await mock.add('unauthorizedUser');

    await page.goto(ROUTE);

    await page.waitForURL((url) => url.pathname === '/login');
    const url = new URL(page.url());
    expect(url.searchParams.get('returnUrl')).toBe(ROUTE);
    // No session was ever held, so the login page must not claim one expired.
    expect(url.searchParams.get('hint')).toBeNull();
});

test('unauthenticated after holding a session: redirects with the expired hint', async ({ page, mock }) => {
    await page.goto(ROUTE);
    await expect(page.getByTestId('guarded-content')).toBeVisible();

    // The session dies server-side and a forced refresh discovers it.
    await mock.add('unauthorizedUser');
    await simulateTabRefocus(page);

    await page.waitForURL((url) => url.pathname === '/login');
    expect(new URL(page.url()).searchParams.get('hint')).toBe('login-expired');
});

test('error: a failed first load shows the error card and recovers on refresh', async ({ page, mock }) => {
    await mock.add('withIdentityDown');

    await test.step('no user and a failed query renders the error card, not the children', async () => {
        await page.goto(ROUTE);
        await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();
        await expect(page.getByTestId('guarded-content')).toBeHidden();
        // An error must not be mistaken for a missing session.
        expect(new URL(page.url()).pathname).toBe(ROUTE);
    });

    await test.step('refresh re-runs the query and hands over to the children', async () => {
        await mock.remove('withIdentityDown');
        await page.getByRole('button', { name: 'Refresh' }).click();
        await expect(page.getByTestId('guarded-content')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Refresh' })).toBeHidden();
    });
});
