import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';
import fs from 'node:fs';
import type { Plugin } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { defineConfig } from 'vitest/config';
import { buildAssets } from './scripts/vite-asset-converter';
import { config } from './src/generated/config';

console.log(`Environment: (${config.environment})`);
if (['dev', 'local', 'mock'].includes(config.environment)) {
    process.env.LOG_LEVEL = 'info,user=trace,api=trace,i18n=trace';
}

const isTest = !!process.env.VITEST;
const isCI = !!process.env.CI;
if (isCI && config.environment !== 'prod') {
    throw new Error('CI deployment shall only use prod environment');
}

const additionalAssets = [];

// If assets are served from the web server, ensure they are built before starting the server and included in the static copy targets
if (config.assetUrl === config.webUrl) {
    await buildAssets();
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

/// Prevents __mock routes from being bundled in production builds
function excludeMockRoutes(): Plugin {
    return {
        name: 'exclude-mock-routes',
        resolveId(id) {
            if (config.environment === 'prod' && id.includes('__mock')) {
                return '\0empty-mock';
            }
        },
        load(id) {
            if (id === '\0empty-mock') {
                return '';
            }
        }
    };
}

export default defineConfig({
    plugins: [
        excludeMockRoutes(),
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
        reporters: isCI ? ['github-actions'] : ['default'],
        browser: {
            enabled: true,
            provider: playwright(),
            instances: [
                {
                    browser: 'chromium',
                    headless: true // Set to false to see browser window (for debugging)
                }
            ]
        },
        include: ['src/**/*.{test,spec}.{js,ts}'],
        exclude: ['src/lib/server/**']
    }
});
