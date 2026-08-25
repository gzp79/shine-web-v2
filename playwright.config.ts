import { defineConfig } from '@playwright/test';
import { config } from './src/generated/config';

console.log(`Environment: (${config.environment})`);
if (['dev', 'local', 'mock'].includes(config.environment)) {
    process.env.DEBUG = 'log:user, log:game, warn:*, info:*';
}

// Fail fast when a suite is run against the wrong environment. `component` and `integration`
// are hermetic (MSW mocks) and require env:mock; `e2e` drives real services and only runs
// against a developer environment (dev or local), never mock or prod. The suite is taken from
// the positional filter (e.g. `playwright test component`).
const E2E_ENVIRONMENTS = ['dev', 'local'];
const suiteFilters = process.argv.slice(2);
const runsMockedSuite = suiteFilters.some((arg) => arg === 'component' || arg === 'integration');
const runsE2E = suiteFilters.includes('e2e');
if (runsMockedSuite && config.environment !== 'mock') {
    throw new Error(
        `Component/integration tests require the "mock" environment, but the current config is "${config.environment}". Run "pnpm run env:mock" first.`
    );
}
if (runsE2E && !E2E_ENVIRONMENTS.includes(config.environment)) {
    throw new Error(
        `e2e tests require a ${E2E_ENVIRONMENTS.join(' or ')} environment, but the current config is "${config.environment}". Run "pnpm run env:local" first.`
    );
}

function fixDeploymentURL(url: string | undefined): string | undefined {
    if (!url) {
        return undefined;
    }

    // Cloudflare deployment URLs sometimes come with a trailing suffix without protocol
    if (!url.startsWith('http')) {
        url = `https://${url}`;
    }
    return url.split(' ')[0];
}

const webURL = fixDeploymentURL(process.env.DEPLOYMENT_URL) || config.webUrl;

export default defineConfig({
    workers: process.env.CI ? 1 : 4,
    webServer: {
        command: 'pnpm run dev',
        port: parseInt(new URL(webURL).port),
        reuseExistingServer: true,
        stdout: 'ignore',
        stderr: 'ignore'
    },
    use: {
        baseURL: webURL,
        headless: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        ignoreHTTPSErrors: true,
        // The mock env registers an MSW browser service worker (src/mocks/setup-client.ts) that
        // has no handlers — it passes every request through. Its only effect here is that a
        // controlling service worker makes page-originated requests invisible to `page.route`,
        // which breaks RequestGate (tests/helpers/request-gate.ts). All mocking that matters is
        // server-side (msw/node via /api/__mock), so blocking the worker loses no coverage and
        // restores direct request interception.
        serviceWorkers: 'block'
    },
    projects: [
        {
            name: 'component',
            testDir: 'tests/component',
            testMatch: '**/*.test.ts'
        },
        {
            // Full-app tests driven through the real UI but against MSW-mocked backends.
            // Deterministic and hermetic, so they run in CI (needs `env:mock`).
            name: 'integration',
            testDir: 'tests/integration',
            testMatch: '**/*.test.ts'
        },
        {
            // True end-to-end tests against real, running services (identity + builder + web).
            // Requires `env:local` (or another real environment) with those services up; NOT run in CI.
            name: 'e2e',
            testDir: 'tests/e2e',
            testMatch: '**/*.test.ts'
        }
    ]
});
