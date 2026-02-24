import { logI18n } from '@lib/loggers';
import type { Locale } from './_translator';

export type Formatter = (locale: Locale, value: unknown) => string;

export const formatters: Record<string, Formatter> = {
    shortDate: (locale: Locale, value: unknown): string => {
        const date = toDate(value);
        if (!date) {
            logI18n.warn('shortDate: invalid date value:', value);
            return String(value);
        }
        return new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        }).format(date);
    },

    longDate: (locale: Locale, value: unknown): string => {
        const date = toDate(value);
        if (!date) {
            logI18n.warn('longDate: invalid date value:', value);
            return String(value);
        }
        return new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    },

    shortTime: (locale: Locale, value: unknown): string => {
        const date = toDate(value);
        if (!date) {
            logI18n.warn('shortTime: invalid date value:', value);
            return String(value);
        }
        return new Intl.DateTimeFormat(locale, {
            hour: 'numeric',
            minute: '2-digit'
        }).format(date);
    },

    longTime: (locale: Locale, value: unknown): string => {
        const date = toDate(value);
        if (!date) {
            logI18n.warn('longTime: invalid date value:', value);
            return String(value);
        }
        return new Intl.DateTimeFormat(locale, {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    },

    dateTime: (locale: Locale, value: unknown): string => {
        const date = toDate(value);
        if (!date) {
            logI18n.warn('dateTime: invalid date value:', value);
            return String(value);
        }
        return new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        }).format(date);
    }
};

/**
 * Convert various date representations to Date object.
 * Handles: Date objects, timestamps (numbers), ISO strings.
 * Returns null for invalid values.
 */
function toDate(value: unknown): Date | null {
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
    }
    if (typeof value === 'number') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
    }
    if (typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
    }
    return null;
}
