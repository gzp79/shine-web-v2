import type { Preview } from '@storybook/sveltekit';
import '../src/app.css';
import { i18n } from '../src/lib/i18n/i18n';
import { type Theme, themeList } from '../src/lib/theme/theme.svelte';
import lang from '../src/translations/lang.json';

i18n.loadTranslations('en', '/');

// Override app.css styles that break Storybook scrolling
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        body, #storybook-root {
            overflow: auto !important;
            height: auto !important;
        }
    `;
    document.head.appendChild(style);
}

const preview: Preview = {
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i
            }
        },

        options: {
            storySort: {
                order: [
                    'Atoms',
                    [
                        'Theme',
                        ['Typography', 'Colors', 'Icons'],
                        'Layouts',
                        ['Box', 'Stack', 'Grid', 'Card'],
                        'Inputs',
                        ['Button'],
                        'Data',
                        ['ProgressBar', 'PropertyList']
                    ]
                ]
            }
        }
    },
    globalTypes: {
        locale: {
            description: 'Internationalization locale',
            defaultValue: 'en',
            toolbar: {
                icon: 'globe',
                items: Object.entries(lang).map(([code, name]) => ({
                    value: code,
                    title: name
                })),
                showName: true,
                dynamicTitle: true
            }
        },
        theme: {
            description: 'Theme',
            defaultValue: 'system',
            toolbar: {
                icon: 'mirror',
                items: themeList.map((t) => ({
                    value: t,
                    title: t.charAt(0).toUpperCase() + t.slice(1)
                })),
                showName: true,
                dynamicTitle: true
            }
        }
    },
    decorators: [
        (story, context) => {
            // Handle locale changes
            const locale = context.globals.locale || 'en';
            i18n.setLocale(locale);
            i18n.loadTranslations(locale, '/');

            // Handle theme changes
            const selectedTheme = (context.globals.theme || 'system') as Theme;
            if (typeof document !== 'undefined') {
                if (selectedTheme === 'system') {
                    document.documentElement.removeAttribute('data-theme');
                } else {
                    document.documentElement.setAttribute('data-theme', selectedTheme);
                }

                // Style docs stories to match app background and add padding
                const docsStories = document.querySelectorAll('.docs-story');
                docsStories.forEach((element) => {
                    element.classList.add('bg-surface', 'p-2');
                });

                // Add padding to Storybook root, it emulates the body padding in the app
                const storybookRoot = document.querySelector('#storybook-root');
                if (storybookRoot) {
                    storybookRoot.classList.add('p-2');
                }
            }

            return story();
        }
    ]
};

export default preview;
