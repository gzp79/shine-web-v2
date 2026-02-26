import { invalidate } from '$app/navigation';
import { page } from '$app/state';
import { type Cookies } from '@sveltejs/kit';
import { getContext, setContext } from 'svelte';
import { logI18n } from '@lib/loggers';
import { getCookie, onTabVisible, setCookie } from '@lib/utils';
import {
    type Locale,
    type TranslationKey,
    type Translator,
    createTranslator,
    defaultLocale,
    localeList
} from './_translator';

export const LOCALE_DATA_KEY = 'data:locale';

function isLocaleSupported(locale: string | undefined | null): locale is Locale {
    return localeList.map((l) => l.toLowerCase()).includes(locale?.toLowerCase() ?? '');
}

export function getLocaleWithFallback(candidate: string | null | undefined, fallback: Locale = defaultLocale): Locale {
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

/// Creates and provides the locale context with reactive translation updates.
///
/// Data flow (SSR + hydration):
/// 1. Server-side rendering:
///    - hooks.server.ts → Reads locale from cookie/accept-language header, stores in event.locals.locale
///    - +layout.server.ts → Passes locals.locale to page.data.locale (serializable)
///    - +layout.ts (universal) → Loads translation JSON for page.data.locale, stores in page.data.translation
///    - +layout.svelte → Calls createLocaleContext(), creates reactive translator from page.data.translation
///
/// 2. Browser-side updates:
///    - +layout.ts (runs in browser too) → Re-loads translation when invalidated via depends(LOCALE_DATA_KEY)
///    - +layout.svelte → Translator auto-updates via $derived when page.data.translation changes
///    - On locale change → setCookie() + invalidate(LOCALE_DATA_KEY) re-triggers browser update flow
///    - On tab focus → Checks cookie, invalidates if changed (keeps tabs in sync)
///
/// Key: Locale/translation are serializable (handled by server). Translator is created client-side using $derived for reactivity.
export function createLocaleContext(): LocaleContext {
    const translator = $derived(createTranslator(page.data.translation));

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
            return translator;
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
    const ctx = getContext<LocaleContext>(LOCALE_CONTEXT_KEY);
    if (!ctx) {
        console.log('Locale context not found, returning default context with fallback translator');
        throw Error('Wtf');
    }
    return ctx;
}

/// Utility to pack parameters and translation key into a string.
/// The returned string can be used where translator is not available yet at construction time (e.g. in zod error messages),
/// but at presentation time the string can be parsed and the translated.
export function createTr(key: TranslationKey, params?: Record<string, unknown>): string {
    return `#${JSON.stringify({ key, params })}`;
}

/// Utility to parse a localized message string and translate it using the provided translator.
export function localizeTr(message: string, translator: Translator): string {
    if (message.startsWith('#')) {
        try {
            const { key, params } = JSON.parse(message.substring(1));
            return translator(key, params);
        } catch {
            return message; // Return the original message if parsing fails
        }
    }
    return message; // Return the original message if it doesn't start with '#'
}
