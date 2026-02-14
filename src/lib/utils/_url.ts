export type QueryParam = string | number | boolean;

export function toQueryString(params?: Record<string, QueryParam>): string {
    if (!params) return '';
    return (
        '?' +
        new URLSearchParams(
            Object.entries(params).reduce(
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
