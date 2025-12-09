import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { defineConfig } from 'vitest/config';
import { vitePluginAssetConverter } from './scripts/vite-asset-converter';
import { config } from './src/generated/config';
import svelteConfig from './svelte.config';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

console.log(`Environment: (${config.environment})`);
if (['dev', 'local', 'mock'].includes(config.environment)) {
    process.env.DEBUG = 'log:user, log:game, warn:*, info:*';
}

const additionalAssets = [];
if (config.environment !== 'prod') {
    additionalAssets.push({
        src: 'static-generated/assets/*',
        dest: ''
    });
}
if (config.environment === 'mock') {
    console.log('  Mocking');
    additionalAssets.push({
        src: 'static-generated/mockServiceWorker.js',
        dest: ''
    });
}

let https;
if (fs.existsSync('certificates/cert.key')) {
    console.log('  Protocol: https');
    // Accept self-signed certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    https = {
        key: fs.readFileSync('certificates/cert.key'),
        cert: fs.readFileSync('certificates/cert.crt'),
        ca: fs.readFileSync('certificates/ca.crt')
    };
} else {
    throw new Error('No certificates were found, using http for serving');
}

export default defineConfig({
    plugins: [
        vitePluginAssetConverter(config.environment),
        tailwindcss(),
        sveltekit(),
        viteStaticCopy({
            targets: [...additionalAssets]
        })
    ],
    server: {
        https: https,
        port: parseInt(new URL(config.webUrl).port),
        host: new URL(config.webUrl).hostname,
        strictPort: true,
        hmr: {
            clientPort: parseInt(new URL(config.webUrl).port),
            port: parseInt(new URL(config.webUrl).port) + 1
        },
        proxy: {}
    },
    preview: {
        https: https,
        port: parseInt(new URL(config.webUrl).port),
        host: new URL(config.webUrl).hostname,
        proxy: {}
    },
    test: {
        expect: {
            requireAssertions: true
        },
        projects: [
            {
                extends: './vite.config.ts',
                test: {
                    name: 'client',
                    browser: {
                        enabled: true,
                        provider: playwright(),
                        instances: [
                            {
                                browser: 'chromium',
                                headless: true
                            }
                        ]
                    },
                    include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
                    exclude: ['src/lib/server/**']
                }
            },
            {
                extends: './vite.config.ts',
                plugins: [
                    storybookTest({
                        configDir: path.join(dirname, '.storybook')
                    })
                ],
                resolve: {
                    alias: svelteConfig.kit?.alias || {}
                },
                test: {
                    name: 'storybook',
                    browser: {
                        enabled: true,
                        headless: true,
                        provider: playwright({}),
                        instances: [
                            {
                                browser: 'chromium'
                            }
                        ]
                    },
                    setupFiles: ['.storybook/vitest.setup.ts']
                }
            }
        ]
    }
});
