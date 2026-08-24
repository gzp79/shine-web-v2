import { type Page, expect } from '@playwright/test';
import { config } from '../../src/generated/config';

/**
 * The Turnstile test site-key that the identity server accepts as an always-passing
 * captcha when it runs with the test secret (local / test environments only).
 * Mirrors `config.turnstile.siteKey` in the local config.
 */
const TEST_CAPTCHA_TOKEN = '1x00000000000000000000AA';

/** Joins a base url and a path with exactly one slash. */
function join(base: string, path: string): string {
    return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

/** The identity guest-login page url (mirrors `authPages.guestLoginUrl`, without the `@lib` barrel). */
function guestLoginUrl(redirectPath: string): string {
    const query = new URLSearchParams({
        redirectUrl: `${config.webUrl}${redirectPath}`,
        errorUrl: `${config.webUrl}/error`,
        rememberMe: 'true',
        captcha: TEST_CAPTCHA_TOKEN
    });
    return join(config.identityUrl, `auth/guest/login?${query}`);
}

/** The identity user-info api url (mirrors `authApiRoutes.myInfo`). */
function myInfoUrl(): string {
    return join(config.identityUrl, 'api/auth/user/info');
}

export type GuestUser = {
    /** The authenticated user's id (as the app and builder see it). */
    userId: string;
    /** Display name assigned by the identity server. */
    name: string;
};

/**
 * Registers and logs in a fresh guest user against the *real* identity server, leaving
 * `page`'s browser context with a valid `sid` session cookie. Returns the new user's id.
 *
 * Real-services only: the identity, builder and web dev servers must be running (e.g. via
 * `pnpm run env:local`). The guest flow is a plain navigation that ends with the identity
 * server setting the session cookie and redirecting back to the app.
 */
export async function loginAsGuest(page: Page): Promise<GuestUser> {
    // Navigate through the identity guest flow, which sets the session and redirects back to the app.
    await page.goto(guestLoginUrl('/account'));

    await page.waitForURL((url) => url.origin === new URL(config.webUrl).origin, { timeout: 20000 });

    // Read the identity the session now resolves to, straight from the identity API.
    const response = await page.request.get(myInfoUrl());
    expect(response.ok(), `guest login did not establish a session (${response.status()})`).toBeTruthy();
    const info = (await response.json()) as { userId: string; name: string };

    return { userId: info.userId, name: info.name };
}
