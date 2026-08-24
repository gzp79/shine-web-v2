import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import fs from 'node:fs';
import type { Plugin } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { defineConfig } from 'vitest/config';
import { buildAssets } from './scripts/vite-asset-converter';
import { CAPTCHA_TEST_SITE_KEY } from './src/constants';
import { config } from './src/generated/config';

console.log(`Environment: (${config.environment})`);
if (['dev', 'local', 'mock'].includes(config.environment) && !process.env.LOG_LEVEL) {
    process.env.LOG_LEVEL = 'info,user=trace,api=trace,i18n=trace';
}

const isBuildCommand = process.argv.includes('build');
if (isBuildCommand && config.environment !== 'prod') {
    throw new Error(
        `Build requires production config. Current environment is "${config.environment}". Run "pnpm run env:prod" before building.`
    );
}

const isCI = !!process.env.CI;

const additionalAssets = [];

// Build assets locally when the asset server is co-located with the web dev server.
const webServerUrl = new URL(config.webUrl);
const assetServerUrl = new URL(config.assetUrl);
const assetsServedByWebServer =
    assetServerUrl.hostname.endsWith('local.scytta.com') && assetServerUrl.port === webServerUrl.port;
if (assetsServedByWebServer) {
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
        // Disabled only for dev/preview — the build guard above ensures this never runs in prod.
        // Do NOT move this outside the dev/preview conditional.
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

/// Prevents mock infrastructure routes from being bundled in non-mock environments
function excludeMocks(): Plugin {
    const excluded = ['__mock', '__test', '@mocks'];

    const isMockRoute = (id: string) => {
        const normalizedId = id.split('?')[0]!.replaceAll('\\', '/');
        const pathParts = normalizedId.split('/');
        return pathParts.some((part) => excluded.includes(part));
    };

    return {
        name: 'exclude-mocks',
        resolveId(id) {
            if (config.environment !== 'mock' && isMockRoute(id)) {
                const isSvelte = id.split('?')[0]!.endsWith('.svelte');
                return isSvelte ? `\0empty-file:${id}` : `\0empty-export:${id}`;
            }
        },
        load(id) {
            if (id.startsWith('\0empty-file:')) {
                return '';
            }
            if (id.startsWith('\0empty-export:')) {
                return 'export {}';
            }
        }
    };
}

export default defineConfig({
    define: {
        'import.meta.env.VITE_MOCK': config.environment === 'mock',
        'import.meta.env.VITE_SKIP_CAPTCHA': config.turnstile.siteKey === CAPTCHA_TEST_SITE_KEY
    },
    plugins: [
        excludeMocks(),
        tailwindcss(),
        sveltekit(),
        svelteTesting(),
        viteStaticCopy({
            targets: [...additionalAssets]
        })
    ],
    ...(config.environment === 'prod' ? {} : serverConfigs()),
    test: {
        expect: {
            requireAssertions: true
        },
        reporters: isCI ? ['github-actions'] : ['default'],
        environment: 'happy-dom',
        setupFiles: ['@testing-library/jest-dom/vitest', './src/testing/vitest-setup.ts'],
        include: ['src/**/*.{test,spec}.{js,ts}'],
        exclude: [
            'src/lib/server/**',
            // TODO: Migrate to @testing-library/svelte or delete (uses vitest-browser-svelte browser-mode APIs)
            'src/routes/page.svelte.spec.ts'
        ]
    }
});
