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
        options: {
            storySort: {
                order: [
                    'Atoms',
                    [
                        'Theme',
                        ['Typography', 'Colors', 'Icons', 'Glyphs'],
                        'Layouts',
                        ['Stack', 'Grid', 'Box', 'Card'],
                        'Inputs',
                        ['Button'],
                        'Data',
                        ['ProgressBar', 'PropertyList'],
                        'Menu',
                        ['Dropdown']
                    ],
                    'Components',
                    ['App', ['MessageContent', 'FlowContent', 'ThemeMenu', 'LanguageMenu'], 'Status']
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
                document.documentElement.setAttribute('data-theme', selectedTheme);
                document.documentElement.classList.add('bg-surface', 'text-on-surface');
            }

            return story();
        }
    ]
};

export default preview;
