import type { TurnstileObject } from 'turnstile-types';

declare global {
    interface Math {
        clamp(value: number, min: number, max: number): number;
        round_q(value: number, precision: number): number;
    }

    namespace App {
        interface Locals {
            theme: ThemeProps;
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
        games?: string[];
    }
}

export {};
