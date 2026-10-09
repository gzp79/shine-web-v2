export type QueryParam = string | number | boolean | null | undefined;

const DUMMY_ORIGIN = 'http://localhost';

/// Reduces a caller-supplied URL to a same-origin path, or `null` if it points anywhere else.
export function sanitizeLocalUrl(rawUrl: string | null | undefined): string | null {
    if (!rawUrl || !rawUrl.startsWith('/')) return null;

    try {
        const parsed = new URL(rawUrl, DUMMY_ORIGIN);
        if (parsed.origin !== DUMMY_ORIGIN) return null;
        return parsed.pathname + parsed.search + parsed.hash;
    } catch {
        return null;
    }
}

export function toQueryString(params?: Record<string, QueryParam>): string {
    if (!params) return '';
    const entries = Object.entries(params).filter(
        (entry): entry is [string, string | number | boolean] => entry[1] != null
    );
    if (entries.length === 0) return '';
    return (
        '?' +
        new URLSearchParams(
            entries.reduce(
                (acc, [key, value]) => {
                    acc[key] = value.toString();
                    return acc;
                },
                {} as Record<string, string>
            )
        ).toString()
    );
}

export function joinURL(...parts: string[]): string {
    return parts.reduce((acc, part, index) => {
        if (index === 0) {
            return part;
        }
        const accEndsWithSlash = acc.endsWith('/');
        const partStartsWithSlash = part.startsWith('/');
        if (accEndsWithSlash && partStartsWithSlash) {
            return acc + part.slice(1);
        } else if (!accEndsWithSlash && !partStartsWithSlash) {
            return acc + '/' + part;
        } else {
            return acc + part;
        }
    }, '');
}
