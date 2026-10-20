import type { Preview } from '@storybook/sveltekit';
import '../src/app.css';
import { createTranslator, getLocaleWithFallback, loadTranslation, localeList } from '../src/lib/i18n';
import { getThemeWithFallback, themeList } from '../src/lib/theme';
import AppLayoutMock from '../src/storybook/AppLayoutMock.svelte';

// Load English translator for toolbar labels
const enTranslator = createTranslator(await loadTranslation('en'));

// Override app.css styles that break Storybook scrolling
// and add a red outline to mark the story's bounds inside the canvas.
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
                        ['Typography', 'Colors', 'Themes', 'Icons', 'Glyphs'],
                        'Layouts',
                        ['Stack', 'Box', 'Card', 'Dialog', 'Separator'],
                        'Inputs',
                        ['Button', 'Input', 'InputGroup', 'Switch', 'Field'],
                        'Data',
                        ['Alert', 'ProgressBar', 'PropertyList'],
                        'Menu',
                        ['Dropdown']
                    ],
                    'Components',
                    [
                        'App',
                        ['CenteredLayout', 'AppMenu', 'ThemeMenu', 'LanguageMenu'],
                        'Buttons',
                        ['ComboButton', 'ConfirmationButton'],
                        'Dialogs',
                        ['ConfirmationDialog'],
                        'Forms',
                        ['ZodField'],
                        'Cards',
                        ['LoadingCard', 'ErrorCard'],
                        'Chat',
                        ['ChatBubble', 'ChatGap', 'ChatInput', 'ChatMessageList']
                    ],
                    'Account',
                    ['UserName', 'UserInfoCard'],
                    'App',
                    ['Chat', ['ChatPing', 'ChatPong']]
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
        (_story, context) => {
            if (typeof document !== 'undefined') {
                document.documentElement.classList.add('bg-surface', 'text-on-surface');
            }

            return {
                Component: AppLayoutMock,
                props: {
                    initialLocale: getLocaleWithFallback(context.globals.locale),
                    initialTheme: getThemeWithFallback(context.globals.theme)
                }
            };
        }
    ]
};

export default preview;
