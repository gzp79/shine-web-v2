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
console.log(`Using web URL: ${webURL}`);

export default defineConfig({
    workers: 4,
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
            name: 'e2e',
            testDir: 'tests/e2e',
            testMatch: '**/*.test.ts'
        }
    ]
});
