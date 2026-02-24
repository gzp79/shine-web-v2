import { logI18n } from '@lib/loggers';
import { formatters } from './_formatters';
import type { Locale } from './_translator';

const VARIABLE_PLACEHOLDER = /{(?<key>\w+)(?:\|(?<formatter>\w+))?}/g;

export function interpolate(locale: Locale, template: string, values?: Record<string, unknown>): string {
    if (!values) {
        return template;
    }

    return template.replace(VARIABLE_PLACEHOLDER, (match, key, formatter) => {
        const value = values[key];
        if (value === undefined) {
            return match;
        }
        if (!formatter) {
            return String(value);
        }

        const formatterFn = formatters[formatter];
        if (formatterFn) {
            try {
                return formatterFn(locale, value);
            } catch (err) {
                logI18n.warn(`Formatter "${formatter}" threw error:`, err);
                return String(value);
            }
        }

        logI18n.warn(`Unknown formatter: ${formatter}`);
        return String(value);
    });
}
