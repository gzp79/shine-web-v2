import { describe, expect, it } from 'vitest';
import { createTranslator, defaultLocale } from './_translator';
import en from './locales/en.json';

describe('translator with formatters', () => {
    const translation = { ...en, locale: defaultLocale };
    const t = createTranslator(translation);

    it('should work with existing simple translations', () => {
        const result = t('hello.world');
        expect(result).toBe('Hello world!');
    });

    it('should interpolate simple variables', () => {
        const result = t('common.greeting', { name: 'Alice' });
        expect(result).toBe('Hello, Alice!');
    });

    it('should format dates with formatters', () => {
        // Add test translation with formatter
        const result = t('common.today', {
            date: new Date('2026-02-24T14:30:00Z')
        });
        expect(result).toMatch(/Today is 2\/24\/2026/);
    });
});
