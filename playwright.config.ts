import { defineConfig } from '@playwright/test';
import { config } from './src/generated/config';

console.log(`Environment: (${config.environment})`);
if (['dev', 'local', 'mock'].includes(config.environment)) {
    process.env.DEBUG = 'log:user, log:game, warn:*, info:*';
}
const isCI = !!process.env.CI;
if (isCI && config.environment !== 'prod') {
    throw new Error('CI deployment shall only use prod environment for e2e tests');
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
console.log(`Using web URL: ${webURL}`);

export default defineConfig({
    // All projects share one MSW server with mutable mock state — run tests serially
    workers: 1,
    webServer: {
        command: 'pnpm run build && pnpm run preview',
        port: parseInt(new URL(webURL).port)
    },
    use: {
        baseURL: webURL,
        headless: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        ignoreHTTPSErrors: !isCI
    },
    projects: [
        {
            name: 'component',
            testDir: 'tests/component',
            testMatch: '**/*.test.ts'
        },
        {
            name: 'e2e',
            testDir: 'tests/e2e',
            testMatch: '**/*.test.ts'
        }
    ]
});
