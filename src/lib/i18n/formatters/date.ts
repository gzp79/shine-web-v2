import { logI18n } from '@lib/loggers';
import type { Locale } from '../_translator';

type FormatOptions = Intl.DateTimeFormatOptions;
const formatCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(locale: string, options: FormatOptions): Intl.DateTimeFormat {
    const key = `${locale}:${JSON.stringify(options)}`;
    let fmt = formatCache.get(key);
    if (!fmt) {
        fmt = new Intl.DateTimeFormat(locale, options);
        formatCache.set(key, fmt);
    }
    return fmt;
}

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

export function shortDate(locale: Locale, value: unknown): string {
    const date = toDate(value);
    if (!date) {
        logI18n.warn('shortDate: invalid date value:', value);
        return String(value);
    }
    return getFormatter(locale, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    }).format(date);
}

export function longDate(locale: Locale, value: unknown): string {
    const date = toDate(value);
    if (!date) {
        logI18n.warn('longDate: invalid date value:', value);
        return String(value);
    }
    return getFormatter(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

export function shortTime(locale: Locale, value: unknown): string {
    const date = toDate(value);
    if (!date) {
        logI18n.warn('shortTime: invalid date value:', value);
        return String(value);
    }
    return getFormatter(locale, {
        hour: 'numeric',
        minute: '2-digit'
    }).format(date);
}

export function longTime(locale: Locale, value: unknown): string {
    const date = toDate(value);
    if (!date) {
        logI18n.warn('longTime: invalid date value:', value);
        return String(value);
    }
    return getFormatter(locale, {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit'
    }).format(date);
}

export function dateTime(locale: Locale, value: unknown): string {
    const date = toDate(value);
    if (!date) {
        logI18n.warn('dateTime: invalid date value:', value);
        return String(value);
    }
    return getFormatter(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    }).format(date);
}
