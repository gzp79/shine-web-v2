import type { TurnstileObject } from 'turnstile-types';
import { type Locale, type Translation } from '@lib/i18n';
import { type Theme } from '@lib/theme';

declare global {
    interface ImportMeta {
        readonly env: ImportMetaEnv & {
            readonly VITE_MOCK: boolean;
            readonly VITE_SKIP_CAPTCHA: boolean;
        };
    }

    interface Math {
        clamp(value: number, min: number, max: number): number;
        round_q(value: number, precision: number): number;
    }

    namespace App {
        interface Locals {
            theme: Theme;
            locale: Locale;
        }

        interface PageData {
            theme: Theme;
            locale: Locale;
            translation: Translation;
        }

        interface Platform {
            env: {
                COUNTER: DurableObjectNamespace;
            };
            context: {
                waitUntil(promise: Promise<unknown>): void;
            };
            caches: CacheStorage & { default: Cache };
        }
    }

    interface Window {
        turnstile?: TurnstileObject;
    }
}

export {};
