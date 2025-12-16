import { defineConfig } from '@playwright/test';
import { config } from './src/generated/config';

console.log(`Environment: (${config.environment})`);
if (['dev', 'local', 'mock'].includes(config.environment)) {
    process.env.DEBUG = 'log:user, log:game, warn:*, info:*';
}
const isCI = !!process.env.DEPLOYMENT_URL;

const webURL = process.env.DEPLOYMENT_URL || config.webUrl;
if (isCI && config.environment !== 'prod') {
    throw new Error('CI deployment shall only use prod environment');
}

export default defineConfig({
    webServer: {
        command: 'pnpm run build && pnpm run preview',
        port: parseInt(new URL(webURL).port)
    },
    testDir: 'tests/e2e',
    use: {
        baseURL: webURL,
        headless: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        ignoreHTTPSErrors: !isCI
    }
});
