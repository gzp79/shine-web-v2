import type { StorybookConfig } from '@storybook/sveltekit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import svelteConfig from '../svelte.config.js';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.@(js|ts|svelte)'],
    addons: ['@storybook/addon-svelte-csf', '@storybook/addon-a11y', '@storybook/addon-vitest'],
    framework: '@storybook/sveltekit',
    staticDirs: ['../static', '../static-generated'],

    async viteFinal(config) {
        // Merge Svelte aliases into Storybook Vite config
        if (svelteConfig.kit && svelteConfig.kit.alias) {
            config.resolve = config.resolve || {};
            config.resolve.alias = {
                ...(config.resolve.alias || {}),
                ...Object.fromEntries(
                    Object.entries(svelteConfig.kit.alias).map(([key, value]) => [
                        key,
                        path.resolve(path.join(dirname, '..'), value as string)
                    ])
                )
            };
        }
        return config;
    }
};
export default config;
