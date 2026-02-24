import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formatters } from './_formatters';
import { interpolate } from './_interpolate';
import type { Locale } from './_translator';

describe('interpolate', () => {
    const locale: Locale = 'en';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('unformatted variable', () => {
        it('should handle simple variable replacement', () => {
            const result = interpolate(locale, 'Hello, {name}!', { name: 'Alice' });
            expect(result).toBe('Hello, Alice!');
        });

        it('should handle multiple variables', () => {
            const result = interpolate(locale, '{greeting}, {name}!', {
                greeting: 'Hello',
                name: 'Bob'
            });
            expect(result).toBe('Hello, Bob!');
        });

        it('should handle missing values', () => {
            const result = interpolate(locale, 'Hello, {name}!', {});
            expect(result).toBe('Hello, {name}!');
        });

        it('should handle undefined params', () => {
            const result = interpolate(locale, 'Hello, {name}!');
            expect(result).toBe('Hello, {name}!');
        });

        it('should handle template without placeholders', () => {
            const result = interpolate(locale, 'Hello, world!', { name: 'Alice' });
            expect(result).toBe('Hello, world!');
        });
    });

    describe('formatter syntax', () => {
        const testDate = new Date('2026-02-24T14:30:00Z');

        it('should apply shortDate formatter', () => {
            const result = interpolate(locale, 'Today is {date|shortDate}', {
                date: testDate
            });
            expect(result).toMatch(/Today is 2\/24\/2026/);
        });

        it('should apply longDate formatter', () => {
            const result = interpolate(locale, 'Date: {date|longDate}', {
                date: testDate
            });
            expect(result).toMatch(/Date: February 24, 2026/);
        });

        it('should apply shortTime formatter', () => {
            const result = interpolate(locale, 'Time: {time|shortTime}', {
                time: testDate
            });
            expect(result).toMatch(/Time: \d{1,2}:\d{2}/);
        });

        it('should handle multiple formatters', () => {
            const result = interpolate(locale, 'On {date|shortDate} at {time|shortTime}', {
                date: testDate,
                time: testDate
            });
            expect(result).toMatch(/On 2\/24\/2026 at \d{1,2}:\d{2}/);
        });

        it('should mix formatted and unformatted variables', () => {
            const result = interpolate(locale, 'Hello, {name}! Today is {date|shortDate}', {
                name: 'Alice',
                date: testDate
            });
            expect(result).toMatch(/Hello, Alice! Today is 2\/24\/2026/);
        });
    });

    describe('error handling', () => {
        it('should warn and fallback for unknown formatter', () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const result = interpolate(locale, 'Value: {x|unknown}', { x: 42 });
            expect(result).toBe('Value: 42');
            warnSpy.mockRestore();
        });

        it('should warn and fallback for invalid date', () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const result = interpolate(locale, 'Date: {date|shortDate}', {
                date: 'invalid'
            });
            expect(result).toBe('Date: invalid');
            warnSpy.mockRestore();
        });

        it('should handle formatter exception', () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            formatters.buggy = () => {
                throw new Error('oops');
            };
            const result = interpolate(locale, 'Value: {x|buggy}', { x: 42 });
            expect(result).toBe('Value: 42');
            delete formatters.buggy;
            warnSpy.mockRestore();
        });

        it('should preserve placeholder if value missing with formatter', () => {
            const result = interpolate(locale, 'Today is {date|shortDate}', {});
            expect(result).toBe('Today is {date|shortDate}');
        });
    });

    describe('edge cases', () => {
        it('should not match malformed syntax {key|}', () => {
            const result = interpolate(locale, 'Value: {key|}', { key: 'test' });
            expect(result).toBe('Value: {key|}');
        });

        it('should not match malformed syntax {|formatter}', () => {
            const result = interpolate(locale, 'Value: {|formatter}', {});
            expect(result).toBe('Value: {|formatter}');
        });

        it('should match inner brace in {{key}}', () => {
            const result = interpolate(locale, 'Value: {{key}}', { key: 'test' });
            expect(result).toBe('Value: {test}');
        });

        it('should handle null value', () => {
            const result = interpolate(locale, 'Value: {x}', { x: null });
            expect(result).toBe('Value: null');
        });

        it('should handle undefined value', () => {
            const result = interpolate(locale, 'Value: {x}', { x: undefined });
            expect(result).toBe('Value: {x}');
        });

        it('should coerce numbers to strings', () => {
            const result = interpolate(locale, 'Count: {count}', { count: 42 });
            expect(result).toBe('Count: 42');
        });

        it('should coerce booleans to strings', () => {
            const result = interpolate(locale, 'Active: {active}', { active: true });
            expect(result).toBe('Active: true');
        });
    });

    describe('locale parameter', () => {
        it('should pass locale to formatter', () => {
            const testDate = new Date('2026-02-24T14:30:00Z');
            const enResult = interpolate('en', 'Date: {date|shortDate}', {
                date: testDate
            });
            const huResult = interpolate('hu', 'Date: {date|shortDate}', {
                date: testDate
            });
            expect(enResult).not.toBe(huResult);
        });
    });
});
