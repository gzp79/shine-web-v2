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

export type Translation = typeof en;
export type TranslationKeys = Flatten<TranslationKeysNested>;
export type TranslationParams = Record<string, unknown>;

const loadedTranslations: Record<string, Translation> = {
    en
};

export type Translator = (key: TranslationKeys, params?: TranslationParams) => string;

/// Load the translation on demand and return a translator function for the given locale.
export async function getTranslator(locale: Locale): Promise<Translator> {
    logI18n.log(`Getting translator for locale: ${locale} ...`);

    if (!loadedTranslations[locale]) {
        loadedTranslations[locale] = await import(`./locales/${locale}.json`);
    }

    return (key: TranslationKeys, params?: TranslationParams): string => {
        const [section, item] = key.split('.') as [string, string];

        // @ts-expect-error - we already typecheck the key argument and types don't know how to properly distinguish the allowed items for a chosen section if we do type the line above properly so we ignore here
        const localeResult = loadedTranslations[locale][section]?.[item];
        if (localeResult) {
            return interpolate(localeResult, params);
        }
        logI18n.warn(`Missing ${locale} translation for ${key}`);

        if (locale !== defaultLocale) {
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
