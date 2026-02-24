import { describe, expect, it } from 'vitest';
import { formatters } from './_formatters';
import type { Locale } from './_translator';

describe('formatters', () => {
    const locale: Locale = 'en';
    const testDate = new Date('2026-02-24T14:30:45Z');
    const testTimestamp = testDate.getTime();
    const testISOString = testDate.toISOString();

    describe('shortDate', () => {
        it('should format Date object', () => {
            const result = formatters.shortDate(locale, testDate);
            expect(result).toMatch(/2\/24\/2026/);
        });

        it('should format timestamp', () => {
            const result = formatters.shortDate(locale, testTimestamp);
            expect(result).toMatch(/2\/24\/2026/);
        });

        it('should format ISO string', () => {
            const result = formatters.shortDate(locale, testISOString);
            expect(result).toMatch(/2\/24\/2026/);
        });

        it('should handle invalid value', () => {
            const result = formatters.shortDate(locale, 'invalid');
            expect(result).toBe('invalid');
        });

        it('should handle null', () => {
            const result = formatters.shortDate(locale, null);
            expect(result).toBe('null');
        });
    });

    describe('longDate', () => {
        it('should format Date object', () => {
            const result = formatters.longDate(locale, testDate);
            expect(result).toMatch(/February 24, 2026/);
        });

        it('should handle invalid value', () => {
            const result = formatters.longDate(locale, 'invalid');
            expect(result).toBe('invalid');
        });
    });

    describe('shortTime', () => {
        it('should format Date object', () => {
            const result = formatters.shortTime(locale, testDate);
            expect(result).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)?/i);
        });

        it('should handle invalid value', () => {
            const result = formatters.shortTime(locale, 'invalid');
            expect(result).toBe('invalid');
        });
    });

    describe('longTime', () => {
        it('should format Date object', () => {
            const result = formatters.longTime(locale, testDate);
            expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}\s*(AM|PM)?/i);
        });

        it('should handle invalid value', () => {
            const result = formatters.longTime(locale, 'invalid');
            expect(result).toBe('invalid');
        });
    });

    describe('dateTime', () => {
        it('should format Date object', () => {
            const result = formatters.dateTime(locale, testDate);
            expect(result).toMatch(/Feb 24, 2026/);
            expect(result).toMatch(/\d{1,2}:\d{2}/);
        });

        it('should handle invalid value', () => {
            const result = formatters.dateTime(locale, 'invalid');
            expect(result).toBe('invalid');
        });
    });

    describe('locale support', () => {
        it('should format differently for different locales', () => {
            const enResult = formatters.shortDate('en', testDate);
            const huResult = formatters.shortDate('hu', testDate);
            expect(enResult).not.toBe(huResult);
        });
    });
});
