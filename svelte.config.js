import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
    preprocess: vitePreprocess(),

    vitePlugin: {
        inspector: {
            showToggleButton: 'always',
            toggleButtonPos: 'bottom-right'
        }
    },

    compilerOptions: {
        experimental: {
            async: true
        }
    },

    kit: {
        // adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
        // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
        // See https://svelte.dev/docs/kit/adapters for more information about adapters.
        adapter: adapter(),
        alias: {
            '@mocks': './src/mocks',
            '@sb': './src/storybook',
            '@config': './src/config',
            '@generated': './src/generated',
            '@translations': './src/translations',
            '@lib': './src/lib'
        },
        experimental: {
            remoteFunctions: true
        }
    }
};

export default config;
