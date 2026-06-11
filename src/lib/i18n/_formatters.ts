import type { Locale } from './_translator';
import * as dateFormatters from './formatters/date';

export type Formatter = (locale: Locale, value: unknown) => string;

export const formatters = {
    shortDate: dateFormatters.shortDate,
    longDate: dateFormatters.longDate,
    shortTime: dateFormatters.shortTime,
    longTime: dateFormatters.longTime,
    dateTime: dateFormatters.dateTime
} satisfies Record<string, Formatter>;
