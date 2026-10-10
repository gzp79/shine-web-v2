import { type FullConfig, chromium } from '@playwright/test';

/// Vite's dev server starts answering the port before it has transformed any route module, and
/// Playwright's `webServer` only waits for the port to open. Each worker then pays the transform
/// cost of whichever route it opens first — inside that test's own timeout — so on a cold server
/// several parallel workers can blow the 5s expectation on their very first assertion.
///
/// Loading the routes once here, through a real browser so the client modules are transformed too,
/// means every worker starts against a warm server. It also shortens the suite.
const WARMUP_ROUTES = ['/login', '/account', '/link/email-verify', '/error'];

const CONNECT_ATTEMPTS = 10;
const CONNECT_RETRY_DELAY_MS = 1000;

export default async function globalSetup(config: FullConfig): Promise<void> {
    const baseURL = config.projects[0]?.use?.baseURL;
    if (!baseURL) return;

    const browser = await chromium.launch();
    try {
        const page = await browser.newPage({ baseURL, ignoreHTTPSErrors: true });

        for (const route of WARMUP_ROUTES) {
            // The server may still be booting when global setup runs, so the first route retries.
            for (let attempt = 1; attempt <= CONNECT_ATTEMPTS; attempt++) {
                try {
                    await page.goto(route, { waitUntil: 'load', timeout: 30000 });
                    break;
                } catch (error) {
                    if (attempt === CONNECT_ATTEMPTS) {
                        console.warn(`[warmup] giving up on ${route}:`, error);
                    } else {
                        await new Promise((resolve) => setTimeout(resolve, CONNECT_RETRY_DELAY_MS));
                    }
                }
            }
        }
    } finally {
        await browser.close();
    }
}
