# ICU-like Interpolation with Formatters

**Date:** 2026-02-24
**Status:** Approved

## Overview

Extend the i18n translator to support ICU-like interpolation syntax with formatters. Translations can now use `{key|formatter}` syntax to apply formatting functions to interpolated values, starting with date/time formatters using the `Intl` API.

**Example:**

```typescript
// Translation: "Today is {date|shortDate}"
t('common.today', { date: Date.now() });
// → "Today is 2/24/2026"
```

## Goals

- Support simplified ICU syntax: `{key|formatter}` in translation strings
- Provide default date/time formatters using `Intl` APIs
- Allow custom formatters via a simple, mutable registry
- Maintain full backwards compatibility with existing `{key}` syntax
- Graceful degradation with warnings for missing formatters

## Non-Goals

- Full ICU MessageFormat support (plurals, select, nested formatters)
- Formatter options/parameters (e.g., `{date|dateTime:format=long}`)
- Per-locale formatter implementations
- Pre-parsing or caching of translation templates

## Architecture

### 1. Global Formatter Registry

Create `_formatters.ts` with a simple mutable object:

```typescript
import type { Locale } from './_translator';

export type Formatter = (locale: Locale, value: unknown) => string;

export const formatters: Record<string, Formatter> = {
    shortDate: (locale, value) => {
        /* ... */
    },
    longDate: (locale, value) => {
        /* ... */
    },
    shortTime: (locale, value) => {
        /* ... */
    },
    longTime: (locale, value) => {
        /* ... */
    },
    dateTime: (locale, value) => {
        /* ... */
    }
};
```

**Design rationale:**

- **Global scope** - Formatters use `Intl` APIs that handle localization internally
- **Mutable object** - Simplest API for registration: `formatters.myFormat = ...`
- **Locale-first signature** - Consistent with `Intl` APIs and common formatter patterns

### 2. Enhanced Interpolation

Update `_interpolate.ts` to handle formatter syntax:

```typescript
const VARIABLE_PLACEHOLDER = /{(?<key>\w+)(?:\|(?<formatter>\w+))?}/g;

export function interpolate(locale: Locale, template: string, values?: Record<string, unknown>): string {
    if (!values) return template;

    return template.replace(VARIABLE_PLACEHOLDER, (match, key, formatter) => {
        const value = values[key];

        // Missing value - preserve placeholder
        if (value === undefined) return match;

        // No formatter - simple string coercion (backwards compatible)
        if (!formatter) return String(value);

        // Apply formatter if found
        const formatterFn = formatters[formatter];
        if (formatterFn) {
            try {
                return formatterFn(locale, value);
            } catch (err) {
                logI18n.warn(`Formatter "${formatter}" threw error:`, err);
                return String(value);
            }
        }

        // Missing formatter - warn and fall back
        logI18n.warn(`Unknown formatter: ${formatter}`);
        return String(value);
    });
}
```

**Key behaviors:**

- **Backwards compatible** - `{key}` works exactly as before
- **Lenient parsing** - Missing formatters fall back to string coercion with warning
- **Error recovery** - Formatter exceptions are caught and logged

### 3. Translator Integration

Update `_translator.ts` to pass locale to `interpolate()`:

```typescript
export function createTranslator(translation: Translation): Translator {
    return (key: TranslationKeys, params?: TranslationParams): string => {
        const [section, item] = key.split('.') as [string, string];
        const localeResult = translation[section]?.[item];

        if (localeResult) {
            return interpolate(translation.locale, localeResult, params);
        }

        // Fallback logic
        if (translation.locale !== defaultLocale) {
            const fallbackResult = loadedTranslations[defaultLocale][section]?.[item];
            if (fallbackResult) {
                return interpolate(defaultLocale, fallbackResult, params);
            }
            logI18n.warn(`Missing fallback for: ${key}`);
        }

        return key;
    };
}
```

**Breaking change:** The `interpolate()` signature changes from `(template, values?)` to `(locale, template, values?)`. Check for direct calls outside the translator and update them.

## Default Formatters

All formatters use `Intl.DateTimeFormat` and handle multiple input types:

### Date/Time Conversion

```typescript
function toDate(value: unknown): Date | null {
    if (value instanceof Date) return value;
    if (typeof value === 'number') return new Date(value);
    if (typeof value === 'string') {
        const parsed = new Date(value);
        return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
}
```

### Formatter Implementations

**shortDate** - Numeric date only

```typescript
shortDate: (locale, value) => {
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
};
```

**longDate** - Long-form date

```typescript
longDate: (locale, value) => {
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
};
```

**shortTime** - Time without seconds

```typescript
shortTime: (locale, value) => {
    const date = toDate(value);
    if (!date) {
        logI18n.warn('shortTime: invalid date value:', value);
        return String(value);
    }
    return new Intl.DateTimeFormat(locale, {
        hour: 'numeric',
        minute: '2-digit'
    }).format(date);
};
```

**longTime** - Time with seconds

```typescript
longTime: (locale, value) => {
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
};
```

**dateTime** - Combined date and time

```typescript
dateTime: (locale, value) => {
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
};
```

## Usage Examples

### Translation Files

```json
{
    "common": {
        "greeting": "Hello, {name}!",
        "today": "Today is {date|shortDate}",
        "welcome": "Welcome back on {date|longDate} at {time|shortTime}",
        "lastLogin": "Last login: {timestamp|dateTime}"
    }
}
```

### Component Code

```typescript
import { getLocaleContext } from '@lib/i18n';

const { t } = getLocaleContext();

// Simple interpolation (unchanged)
t('common.greeting', { name: 'Alice' });
// → "Hello, Alice!"

// Date formatting
t('common.today', { date: Date.now() });
// → "Today is 2/24/2026"

t('common.welcome', { date: new Date(), time: Date.now() });
// → "Welcome back on February 24, 2026 at 2:30 PM"

// Multiple formatters
t('common.lastLogin', { timestamp: new Date('2026-02-20T14:30:00') });
// → "Last login: Feb 20, 2026, 2:30 PM"
```

### Custom Formatters

```typescript
import { formatters } from '@lib/i18n';

// Add a custom formatter
formatters.uppercase = (locale, value) => String(value).toUpperCase();

// Use in translations
// "message": "Status: {status|uppercase}"
t('common.message', { status: 'active' });
// → "Status: ACTIVE"
```

## Error Handling & Edge Cases

### Missing Values

```typescript
// Translation: "Today is {date|shortDate}"
t('common.today', {}); // missing date
// → "Today is {date|shortDate}" (placeholder preserved)
```

### Missing Formatters

```typescript
// Translation: "Price: {amount|currency}"
t('common.price', { amount: 42 });
// → Logs: "Unknown formatter: currency"
// → Returns: "Price: 42" (falls back to String)
```

### Invalid Values

```typescript
// Translation: "Date: {date|shortDate}"
t('common.date', { date: 'invalid-date' });
// → Logs: "shortDate: invalid date value: invalid-date"
// → Returns: "Date: invalid-date" (falls back to String)
```

### Formatter Exceptions

```typescript
formatters.buggy = (locale, value) => {
    throw new Error('oops');
};

t('common.test', { x: 123 }); // uses {x|buggy}
// → Logs: 'Formatter "buggy" threw error: oops'
// → Returns: "123" (falls back to String)
```

### Malformed Syntax

```typescript
// "{key|}" or "{|formatter}" don't match regex - treated as literal text
"{key|}" → "{key|}" (no interpolation)
"{{key}}" → "{{key}}" (no interpolation)
```

## Testing Strategy

### Unit Tests (`_interpolate.test.ts`)

- Simple replacement: `{name}` works as before
- Formatter syntax: `{date|shortDate}` formats correctly
- Missing formatter: warns and falls back to string
- Missing value: preserves placeholder
- Invalid date value: warns and falls back to string
- Formatter exception: catches, logs, falls back
- Multiple placeholders with mixed syntax
- Edge cases: empty params, null/undefined values, malformed syntax

### Integration Tests (`_translator.test.ts`)

- `t('key', { date: Date.now() })` formats with correct locale
- Locale changes affect formatter output (test 'en' vs 'hu')
- Fallback translations work with formatters
- Missing translation keys still return key

### Default Formatter Tests (`_formatters.test.ts`)

- Each formatter with valid Date, timestamp, ISO string
- Each formatter with invalid input (string, null, undefined)
- Locale-specific formatting differences (e.g., 'en' vs 'hu' date formats)

## Migration & Compatibility

### Backwards Compatibility

- ✅ Existing `{key}` syntax works unchanged
- ✅ Existing `t()` calls work without modification
- ✅ Translation files don't need updates (formatters are opt-in)

### Breaking Changes

- ❌ Direct calls to `interpolate()` need signature update: `interpolate(locale, template, values)`

### Migration Steps

1. Search codebase for `import { interpolate }` outside `_translator.ts`
2. Update call sites to pass locale as first parameter
3. If no external usage found, proceed with implementation

## Future Enhancements (Out of Scope)

- Formatter options: `{date|dateTime:format=long,timezone=UTC}`
- Number formatters: `currency`, `percent`, `decimal`
- List formatters: `{items|list:type=conjunction}`
- Relative time: `{date|relativeTime}`
- Plural support: `{count|plural:one=item,other=items}`
- Template caching/memoization for performance
- Pre-parsing translations at load time

## Summary

This design adds ICU-like interpolation with formatters through three simple changes:

1. Create a global formatter registry with date/time defaults
2. Enhance the regex in `interpolate()` to handle `{key|formatter}` syntax
3. Pass locale from `createTranslator()` to `interpolate()`

The implementation maintains full backwards compatibility, provides graceful degradation, and establishes a foundation for future formatting needs.
