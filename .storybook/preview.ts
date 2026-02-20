import type { Preview } from '@storybook/sveltekit';
import '../src/app.css';
import { type Locale, getTranslator, localeList } from '../src/lib/i18n';
import { type Theme, themeList } from '../src/lib/theme';
import StorybookLayoutProvider from './StorybookLayoutProvider.svelte';

// Load English translator for toolbar labels
const enTranslator = await getTranslator('en');

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
            // Setup popover root element
            // Popup elements are added to a separate root element with id "popover".
            // In application this is handled by the app shell, but in Storybook we need to create it ourselves.
            if (typeof document !== 'undefined') {
                let popupRoot = document.getElementById('popover');
                if (!popupRoot) {
                    popupRoot = document.createElement('div');
                    popupRoot.id = 'popover';
                    document.body.appendChild(popupRoot);
                }
            }

            // Apply theme to document root
            const selectedTheme = (context.globals.theme || 'system') as Theme;
            if (typeof document !== 'undefined') {
                document.documentElement.classList.add('bg-surface', 'text-on-surface');
            }

            // Get initial values from globals
            const selectedLocale = (context.globals.locale || 'en') as Locale;

            console.log(`Decorator: selectedLocale=${selectedLocale}, selectedTheme=${selectedTheme}`);

            // Wrap the story in StorybookLayoutProvider to set up all contexts
            const storyResult = story();
            return {
                Component: StorybookLayoutProvider,
                props: {
                    initialLocale: selectedLocale,
                    initialTheme: selectedTheme,
                    StoryComponent: storyResult.Component,
                    storyProps: storyResult.props
                }
            };
        }
    ]
};

export default preview;
