import type { StorybookConfig } from '@storybook/sveltekit';

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.@(js|ts|svelte)'],
    addons: ['@storybook/addon-svelte-csf'],
    framework: '@storybook/sveltekit',
    // Path aliases come from the sveltekit() plugin in vite.config.ts
    staticDirs: ['../static', '../static-generated']
};
export default config;
