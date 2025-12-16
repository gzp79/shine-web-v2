/* cspell: disable */
import { getRequestEvent, query } from '$app/server';
import { logI18n } from '@lib/loggers';
import { z } from 'zod';
import { i18n } from './i18n';
import type { LanguageProps } from './i18n.svelte';

const { locales, defaultLocale, loadTranslations, translations } = i18n;

function getSupportedLocale(candidate: string) {
    const supportedLocales = locales.get().map((l) => l.toLowerCase());
    return supportedLocales.includes(candidate) ? candidate : defaultLocale;
}

export const loadLanguage = query(z.string(), async (pathname) => {
    const event = getRequestEvent();
    if (!event) {
        throw new Error('Request event not found');
    }

    const { cookies, request } = event;

    let locale = (cookies.get('lang') || '').toLowerCase();
    if (!locale) {
        logI18n('Checking accept-language ...');
        const acceptLanguageHeader = request.headers.get('accept-language');
        const browserLang = acceptLanguageHeader
            ? acceptLanguageHeader.match(/[a-zA-Z]+?(?=-|_|,|;)/)
            : null;
        locale = (browserLang ? browserLang[0] : '').toLowerCase();
    }
    logI18n(`Selected language, server side: ${locale}`);

    locale = getSupportedLocale(locale);
    await loadTranslations(locale, pathname);

    const languageProps: LanguageProps = {
        i18n: { locale, route: pathname },
        translations: translations.get()
    };

    return languageProps;
});
