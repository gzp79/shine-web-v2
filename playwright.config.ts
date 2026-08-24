import { defineConfig } from '@playwright/test';
import { config } from './src/generated/config';

console.log(`Environment: (${config.environment})`);
if (['dev', 'local', 'mock'].includes(config.environment)) {
    process.env.DEBUG = 'log:user, log:game, warn:*, info:*';
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
        ignoreHTTPSErrors: true
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
