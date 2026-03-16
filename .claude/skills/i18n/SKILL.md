---
name: i18n
description: Translation system with ICU-like interpolation and formatters. Use when adding translation keys, using locale context in components, formatting dates/times in translations, or creating custom formatters. Covers the {key|formatter} syntax, available formatters, and how to extend the system.
---

# i18n - Translation & Interpolation

## Quick Reference

```typescript
// In any component
import { getLocaleContext } from '@lib/i18n';

const locale = getLocaleContext();

// Simple interpolation
locale.t('common.greeting', { name: 'Alice' }); // "Hello, Alice!"

// With formatter
locale.t('common.today', { date: Date.now() }); // "Today is 3/16/2026"

// Reactive locale (readable + writable)
locale.current; // 'en' | 'hu'
```

## Translation Keys

Keys are type-safe, enforced from `en.json` structure. Format: `'section.key'`.

**Adding new keys:** Add to both `src/lib/i18n/locales/en.json` and `hu.json`.

```json
{
    "section": {
        "myKey": "Hello, {name}!",
        "myDateKey": "Created on {date|shortDate}"
    }
}
```

## Interpolation Syntax

| Syntax             | Behavior                                      |
| ------------------ | --------------------------------------------- |
| `{key}`            | Simple string coercion                        |
| `{key\|formatter}` | Apply named formatter                         |
| Missing value      | Placeholder preserved: `{key}`                |
| Unknown formatter  | Warning logged, falls back to `String(value)` |
| Formatter error    | Warning logged, falls back to `String(value)` |

## Available Formatters

All date/time formatters accept `Date`, `number` (timestamp), or ISO string. They use `Intl.DateTimeFormat` with the current locale.

| Formatter   | Example (en)          | Example (hu)          |
| ----------- | --------------------- | --------------------- |
| `shortDate` | 3/16/2026             | 2026. 03. 16.         |
| `longDate`  | March 16, 2026        | 2026. március 16.     |
| `shortTime` | 2:30 PM               | 14:30                 |
| `longTime`  | 2:30:45 PM            | 14:30:45              |
| `dateTime`  | Mar 16, 2026, 2:30 PM | 2026. márc. 16. 14:30 |

## Adding Custom Formatters

```typescript
// src/lib/i18n/_formatters.ts
import { formatters } from './_formatters';

formatters.uppercase = (locale, value) => String(value).toUpperCase();

// Then use in translations: "Status: {status|uppercase}"
```

**Formatter signature:** `(locale: Locale, value: unknown) => string`

## Component Usage Pattern

```svelte
<script lang="ts">
    import { getLocaleContext } from '@lib/i18n';

    const locale = getLocaleContext();
</script>

<p>{locale.t('account.welcome', { name: 'User', date: Date.now() })}</p><p>{locale.t('account.logout')}</p>
```

## Key Files

| File                              | Purpose                                                             |
| --------------------------------- | ------------------------------------------------------------------- |
| `src/lib/i18n/_interpolate.ts`    | Interpolation engine with `{key\|formatter}` regex                  |
| `src/lib/i18n/_formatters.ts`     | Formatter registry (mutable `Record<string, Formatter>`)            |
| `src/lib/i18n/formatters/date.ts` | Date/time formatter implementations                                 |
| `src/lib/i18n/_translator.ts`     | Translator creation, locale loading, fallback logic                 |
| `src/lib/i18n/_i18n.svelte.ts`    | Reactive locale context (`createLocaleContext`, `getLocaleContext`) |
| `src/lib/i18n/locales/en.json`    | English translations                                                |
| `src/lib/i18n/locales/hu.json`    | Hungarian translations                                              |

## Supported Locales

```typescript
export const localeList = ['en', 'hu'] as const;
export type Locale = 'en' | 'hu';
export const defaultLocale: Locale = 'en';
```

Fallback: if a key is missing in the current locale, the English translation is used. If that's also missing, the raw key string is returned.

## Testing Translations

Unit test formatters and interpolation directly:

```typescript
import { interpolate } from './_interpolate';

test('formats date with shortDate', () => {
    const result = interpolate('en', 'Date: {d|shortDate}', { d: new Date(2026, 2, 16) });
    expect(result).toBe('Date: 3/16/2026');
});
```
