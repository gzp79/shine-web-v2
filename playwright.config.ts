import { defineConfig } from '@playwright/test';
import { config } from './src/generated/config';

console.log(`Environment: (${config.environment})`);
if (['dev', 'local', 'mock'].includes(config.environment)) {
    process.env.DEBUG = 'log:user, log:game, warn:*, info:*';
}

export default defineConfig({
    webServer: {
        command: 'pnpm run build && pnpm run preview',
        port: parseInt(new URL(config.webUrl).port)
    },
    testDir: 'tests/e2e',
    use: {
        baseURL: config.webUrl,
        headless: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        ignoreHTTPSErrors: true
    }
});
