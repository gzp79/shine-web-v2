import { browser } from '$app/environment';
import { type Cookies } from '@sveltejs/kit';
import { getContext, setContext } from 'svelte';
import { fromStore } from 'svelte/store';
import { logI18n } from '@lib/loggers';
import { getCookie, setCookie } from '@lib/utils';
import { defaultLocale, i18n, langList } from './i18n';

const { t, locale, locales, setRoute, loadTranslations } = i18n;

export { langList, defaultLocale, t, loadTranslations };

function isLocaleSupported(candidate: string): boolean {
    return locales
        .get()
        .map((l) => l.toLowerCase())
        .includes(candidate);
}

export function getDefaultBrowserLocale(): string {
    logI18n.log(`Finding default browser language (${navigator.language}) ...`);
    return `${navigator.language}`.toLowerCase();
}

export type RouteLocale = {
    locale: string;
    route: string;
};

export async function loadLocaleServerSide(url: URL, cookies: Cookies, headers: Headers): Promise<RouteLocale> {
    const { pathname } = url;

    let locale = cookies.get('lang') || '';
    logI18n.log('Locale from cookie: ' + locale);
    if (!isLocaleSupported(locale)) {
        logI18n.log('Checking accept-language ...');
        locale = `${`${headers.get('accept-language')}`.match(/[a-zA-Z]+?(?=-|_|,|;)/)}`.toLowerCase();
        logI18n.log('Locale from accept-language: ' + locale);
    }
    locale = isLocaleSupported(locale) ? locale : defaultLocale;
    logI18n.log(`Selected language, server side: ${locale}`);

    return {
        locale,
        route: pathname
    };
}

export function loadLocale(fallback: string = defaultLocale): string {
    if (!browser) {
        return fallback;
    }

    let locale = getCookie('lang') ?? getDefaultBrowserLocale();
    logI18n.log(`Locale from cookie or browser: ${locale} ${getCookie('lang')}`);
    locale = isLocaleSupported(locale) ? locale : fallback;
    logI18n.log(`Selected language, client side: ${locale}`);
    return locale;
}

const LOCALE_CONTEXT_KEY = Symbol('locale-context');

export type LocaleContext = {
    current: string;
    route: string;
};

export function createLocaleContext(): LocaleContext {
    const rune = fromStore(locale);

    $effect(() => {
        if (rune.current) {
            logI18n.log(`Setting cookie and document lang to ${rune.current}`);
            setCookie('lang', rune.current);
            document.documentElement.lang = rune.current;
        }
    });

    const store = {
        get current() {
            return rune.current;
        },
        set current(value: string) {
            logI18n.info(`Setting current locale to ${value}, ${isLocaleSupported(value)}`);
            rune.current = isLocaleSupported(value) ? value : defaultLocale;
            console.log(`!!!!!Locale set to ${locale.get()}`);
        },
        set route(value: string) {
            logI18n.info(`Setting current route to ${value}`);
            setRoute(value);
        }
    };
    setContext(LOCALE_CONTEXT_KEY, store);

    return store;
}

export function getLocaleContext(): LocaleContext {
    return getContext<LocaleContext>(LOCALE_CONTEXT_KEY);
}
