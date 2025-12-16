/* cspell: disable */
import { json, type RequestEvent } from '@sveltejs/kit';
import { logI18n } from '@lib/loggers';
import { i18n } from './i18n';
import type { LanguageProps } from './i18n.svelte';

const { locales, defaultLocale, loadTranslations, translations } = i18n;

function getSupportedLocale(candidate: string) {
    const supportedLocales = locales.get().map((l) => l.toLowerCase());
    return supportedLocales.includes(candidate) ? candidate : defaultLocale;
}

export async function loadLanguageQuery(
    { cookies, request }: RequestEvent,
    callArgs: { pathname: string }
) {
    const { pathname } = callArgs;

    let locale = (cookies.get('lang') || '').toLowerCase();
    if (!locale) {
        logI18n('Checking accept-language ...');
        locale = `${`${request.headers.get('accept-language')}`.match(
            /[a-zA-Z]+?(?=-|_|,|;)/
        )}`.toLowerCase();
    }
    logI18n(`Selected language, server side: ${locale}`);

    locale = getSupportedLocale(locale);
    await loadTranslations(locale, pathname);

    const languageProps: LanguageProps = {
        i18n: { locale, route: pathname },
        translations: translations.get()
    };

    return json(languageProps);
}
