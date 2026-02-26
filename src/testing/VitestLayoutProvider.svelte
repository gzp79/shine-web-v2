<script module lang="ts">
    import { logI18n } from '@lib/loggers';
    import { setCookie } from '@lib/utils';
    import {
        type Locale,
        type Translation,
        createTranslator,
        defaultLocale,
        loadTranslation,
        setLocaleContext
    } from '../lib/i18n';
    import { type Theme, defaultTheme, setThemeContext } from '../lib/theme';

    const translators: Record<Locale, Translation> = {
        en: await loadTranslation('en'),
        hu: await loadTranslation('hu')
    };
</script>

<script lang="ts">
    let {
        testResult
    }: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        testResult: any;
    } = $props();

    let locale = $state<Locale>(defaultLocale);
    let translator = $derived(createTranslator(translators[locale]));

    setLocaleContext({
        get current() {
            return locale;
        },
        set current(newLocale: Locale) {
            if (locale !== newLocale) {
                locale = newLocale;
                logI18n.log(`Updating locale to: ${newLocale}`);
                setCookie('lang', newLocale);
            }
        },
        get t() {
            return translator;
        }
    });

    let theme = $state<Theme>(defaultTheme);
    setThemeContext({
        get current() {
            return theme;
        },
        set current(newTheme: Theme) {
            theme = newTheme;
        }
    });

    // Update theme attribute when theme changes
    $effect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', theme);
        }
    });
</script>

<div id="popover"></div>
<testResult.Component {...testResult.props} />
