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

const isTest = !!process.env.VITEST;
const isCI = !!process.env.CI;
if (isCI && config.environment !== 'prod') {
    throw new Error('CI deployment shall only use prod environment');
}

const additionalAssets = [];
if (config.environment !== 'prod') {
    additionalAssets.push({
        src: 'static-generated/assets/*',
        dest: ''
    });
}
if (config.environment === 'mock') {
    additionalAssets.push({
        src: 'static-generated/mockServiceWorker.js',
        dest: ''
    });
}

/// get vite config for development server
function serverConfigs() {
    let https;
    if (fs.existsSync('certificates/cert.key')) {
        console.warn(`On self signed cert issue consider adding it to the trusted certs:
            certutil -addstore -user "ROOT" ".\\certificates\\ca.crt"
            Import-Certificate -FilePath ".\\certificates\\ca.crt" -CertStoreLocation Cert:\\CurrentUser\\Root
        `);
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        https = {
            key: fs.readFileSync('certificates/cert.key'),
            cert: fs.readFileSync('certificates/cert.crt'),
            ca: fs.readFileSync('certificates/ca.crt')
        };
    } else {
        throw new Error('No certificates were found');
    }

    return {
        server: {
            https: https,
            port: parseInt(new URL(config.webUrl).port),
            host: new URL(config.webUrl).hostname,
            strictPort: true,
            hmr: {
                protocol: 'wss',
                host: new URL(config.webUrl).hostname,
                port: parseInt(new URL(config.webUrl).port)
            },
            proxy: {}
        },
        preview: {
            https: https,
            port: parseInt(new URL(config.webUrl).port),
            host: new URL(config.webUrl).hostname,
            proxy: {}
        }
    };
}

export default defineConfig({
    plugins: [
        !isCI && vitePluginAssetConverter(config.environment),
        tailwindcss(),
        sveltekit(),
        viteStaticCopy({
            targets: [...additionalAssets]
        })
    ],
    ...(isTest ? {} : serverConfigs()),
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
