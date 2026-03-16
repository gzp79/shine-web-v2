import type { Page } from '@playwright/test';

const IDENTITY_AUTH_PATTERN = '**/identity/auth/**';

/**
 * Intercept browser navigations to the identity server's auth pages.
 * Use this to simulate the identity server's redirect responses in tests,
 * since auth flows now navigate directly to the identity server.
 *
 * @example
 * ```ts
 * // Simulate successful logout (identity server redirects to bye page)
 * await interceptIdentityAuth(page, (url) => {
 *     if (url.pathname.includes('/auth/logout')) {
 *         return { redirect: url.searchParams.get('redirectUrl') || '/public/bye' };
 *     }
 * });
 * ```
 */
export async function interceptIdentityAuth(
    page: Page,
    handler: (url: URL) => { redirect: string } | { status: number; body?: string } | undefined
) {
    await page.route(IDENTITY_AUTH_PATTERN, (route) => {
        const url = new URL(route.request().url());
        const result = handler(url);

        if (!result) {
            return route.abort();
        }

        if ('redirect' in result) {
            return route.fulfill({
                status: 302,
                headers: { Location: result.redirect }
            });
        }

        return route.fulfill({
            status: result.status,
            body: result.body || ''
        });
    });
}

/**
 * Intercept all identity server auth navigations and redirect to the
 * URL specified in the `redirectUrl` query parameter (standard behavior).
 */
export async function interceptIdentityAuthWithRedirect(page: Page, paramName = 'redirectUrl') {
    await interceptIdentityAuth(page, (url) => {
        const redirectUrl = url.searchParams.get(paramName);
        if (redirectUrl) {
            return { redirect: redirectUrl };
        }
    });
}

/**
 * Intercept all identity server auth navigations and respond with a
 * server error (simulates identity server being down).
 */
export async function interceptIdentityAuthWithError(page: Page, status = 503) {
    await interceptIdentityAuth(page, () => {
        return { status, body: 'Service unavailable' };
    });
}
