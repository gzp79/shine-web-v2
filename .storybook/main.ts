import type { StorybookConfig } from '@storybook/sveltekit';
import { stubRemoteFunctions } from './remote-stub';

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.@(js|ts|svelte)'],
    addons: ['@storybook/addon-svelte-csf'],
    framework: '@storybook/sveltekit',
    // Path aliases come from the sveltekit() plugin in vite.config.ts
    staticDirs: ['../static', '../static-generated'],

    viteFinal(viteConfig) {
        viteConfig.plugins = [...(viteConfig.plugins ?? []), stubRemoteFunctions()];

        // SvelteKit's client runtime reads this global, which only kit's own build/dev pipeline
        // defines. Storybook builds the preview itself, so it has to supply it or every story dies
        // with "__SVELTEKIT_PAYLOAD__ is not defined".
        viteConfig.define = { ...viteConfig.define, __SVELTEKIT_PAYLOAD__: '{}' };

        return viteConfig;
    }
};
export default config;
