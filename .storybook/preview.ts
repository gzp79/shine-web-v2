import type { Preview } from '@storybook/sveltekit';
import '../src/app.css';
import { createTranslator, getLocaleWithFallback, loadTranslation, localeList } from '../src/lib/i18n';
import { getThemeWithFallback, themeList } from '../src/lib/theme';
import AppLayoutMock from '../src/storybook/AppLayoutMock.svelte';

// Load English translator for toolbar labels
const enTranslator = createTranslator(await loadTranslation('en'));

// Override app.css styles that break Storybook scrolling
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        #storybook-root {
            overflow: auto !important;
            height: auto !important;
            padding: 5px !important;
            outline: 2px solid rgba(255, 0, 0, 0.5) !important;
            outline-offset: -5px;
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
                        ['Button', 'Input', 'InputGroup'],
                        'Data',
                        ['ProgressBar', 'PropertyList'],
                        'Menu',
                        ['Dropdown']
                    ],
                    'Components',
                    ['App', ['CenteredLayout', 'StackLayout', 'ThemeMenu', 'LanguageMenu'], 'Status']
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
                items: localeList.map((name) => ({
                    value: name,
                    title: enTranslator(`language.${name}`)
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
            const selectedTheme = getThemeWithFallback(context.globals.theme);
            if (typeof document !== 'undefined') {
                document.documentElement.classList.add('bg-surface', 'text-on-surface');
            }

            const selectedLocale = getLocaleWithFallback(context.globals.locale);

            // Call story() here to get the rendered story
            const storyResult = story();

            return {
                Component: AppLayoutMock,
                props: {
                    initialLocale: selectedLocale,
                    initialTheme: selectedTheme,
                    storyResult
                }
            };
        }
    ]
};

export default preview;
