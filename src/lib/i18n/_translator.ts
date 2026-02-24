import { logI18n } from '@lib/loggers';
import { interpolate } from './_interpolate';
import en from './locales/en.json';

export const localeList = ['en', 'hu'] as const;
export type Locale = (typeof localeList)[number];

export const defaultLocale: Locale = 'en';

type TranslationKeysNested = {
    [K in keyof typeof en]: {
        [L in StringKeyof<(typeof en)[K]>]: `${K}.${L}`;
    };
}[keyof typeof en];

type StringKeyof<T> = Extract<keyof T, string>;
type Flatten<T> = T extends infer U ? ({ [K in keyof U]: U[K] } extends Record<keyof U, infer V> ? V : never) : never;

export type Translation = typeof en & { locale: Locale };
export type TranslationKeys = Flatten<TranslationKeysNested>;
export type TranslationParams = Record<string, unknown>;

const loadedTranslations: Record<string, Translation> = {
    en: { ...en, locale: 'en' }
};

/// Load the translation on demand for the given locale.
/// Loaded translations are cached in a global loadedTranslations object, so they are loaded only
/// once per locale and shared across the app.
export async function loadTranslation(locale: Locale): Promise<Translation> {
    logI18n.log(`Loading translation for locale: ${locale} ...`);

    if (!loadedTranslations[locale]) {
        const translation = await import(`./locales/${locale}.json`);
        loadedTranslations[locale] = { ...translation, locale };
    }

    return loadedTranslations[locale];
}

export type Translator = (key: TranslationKeys, params?: TranslationParams) => string;

/// Create a translator function for the given translation.
export function createTranslator(translation: Translation): Translator {
    return (key: TranslationKeys, params?: TranslationParams): string => {
        const [section, item] = key.split('.') as [string, string];

        // @ts-expect-error - we already typecheck the key argument and types don't know how to properly distinguish the allowed items for a chosen section if we do type the line above properly so we ignore here
        const localeResult = translation[section]?.[item];
        if (localeResult) {
            return interpolate(localeResult, params);
        }
        logI18n.warn(`Missing ${translation.locale} translation for ${key}`);

        if (translation.locale !== defaultLocale) {
            // @ts-expect-error - same issue as above
            const fallbackResult = loadedTranslations[defaultLocale][section]?.[item];
            if (fallbackResult) {
                return interpolate(fallbackResult, params);
            }
            logI18n.warn(`Missing fallback for: ${key}`);
        }

        // if (dev && browser) {
        //     throw new Error(`Missing i18n key: ${key}`);
        // }

        return key;
    };
}
