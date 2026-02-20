import { invalidate } from '$app/navigation';
import { page } from '$app/state';
import { type Cookies } from '@sveltejs/kit';
import { getContext, setContext } from 'svelte';
import { logI18n } from '@lib/loggers';
import { getCookie, onTabVisible, setCookie } from '@lib/utils';
import { type Locale, type Translator, defaultLocale, localeList } from './_translator';

export const LOCALE_DATA_KEY = 'data:locale';

function isLocaleSupported(locale: string | undefined | null): locale is Locale {
    return localeList.map((l) => l.toLowerCase()).includes(locale?.toLowerCase() ?? '');
}

function getLocaleWithFallback(candidate: string | null | undefined, fallback: Locale = defaultLocale): Locale {
    return isLocaleSupported(candidate) ? candidate : fallback;
}

export function getLocaleFromBrowser(): Locale {
    logI18n.log(`Finding default browser language (${navigator.language}) ...`);
    return getLocaleWithFallback(`${navigator.language}`.toLowerCase());
}

export async function getLocaleFromRequest(cookies: Cookies, headers: Headers): Promise<Locale> {
    const cookieLocale = cookies.get('lang');
    if (isLocaleSupported(cookieLocale)) {
        logI18n.log(`Locale from cookie: ${cookieLocale}`);
        return cookieLocale;
    }

    const acceptHeaderLocale = `${headers.get('accept-language')}`.match(/[a-zA-Z]+?(?=-|_|,|;)/)?.[0]?.toLowerCase();
    if (isLocaleSupported(acceptHeaderLocale)) {
        logI18n.log(`Locale from accept-language: ${acceptHeaderLocale}`);
        return acceptHeaderLocale;
    }

    logI18n.log(`Locale from default: ${defaultLocale}`);
    return defaultLocale;
}

const LOCALE_CONTEXT_KEY = Symbol('locale-context');

export type LocaleContext = {
    current: Locale;
    readonly t: Translator;
};

/// Create and provide the locale context, with the initial locale from server or browser, and keep it in sync with cookie changes.
/// Server logic:
///  - hooks.server.ts → handle({ event, resolve }), reads locale from cookie and put it in event.locals
///  - +layout.server.ts → load({ locals, translator }), puts locale and translator in page.data
//   - +layout.svelte → createLocalContext, creates the context from the page.data
/// Browser logic:
///   - +layout.svelte → createLocalContext, creates the context from the page.data
///   - on update, invalidate(LOCALE_DATA_KEY) and trigger load function
///   - across tabs it uses onTabVisible to refresh from cookie
export function createLocaleContext(): LocaleContext {
    const context = {
        get current() {
            return page.data.locale;
        },
        set current(newLocale: Locale) {
            const loc = getLocaleWithFallback(newLocale);
            if (page.data.locale !== loc) {
                logI18n.log(`Updating locale to: ${loc}`);
                setCookie('lang', loc);
                invalidate(LOCALE_DATA_KEY);
            }
        },
        get t() {
            return page.data.translator;
        }
    } satisfies LocaleContext;

    // When switching tab, refresh the locale from cookie to keep it in sync across tabs
    onTabVisible((visible) => {
        if (visible) {
            const cookieLocale = getLocaleWithFallback(getCookie('lang'));
            if (page.data.locale !== cookieLocale) {
                invalidate(LOCALE_DATA_KEY);
            }
        }
    });

    setLocaleContext(context);
    return context;
}

/// A low level API to set the locale context directly used for testing.
export function setLocaleContext(context: LocaleContext) {
    setContext(LOCALE_CONTEXT_KEY, context);
}

export function getLocaleContext(): LocaleContext {
    return getContext<LocaleContext>(LOCALE_CONTEXT_KEY);
}
