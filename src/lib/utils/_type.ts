export function typeOfT<T>(value: T): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';

    if (Array.isArray(value)) {
        const first = value[0];
        const elemName = typeOfT(first);
        return `Array<${elemName}>`;
    }

    const ctorName = (value as unknown)?.constructor?.name;
    if (ctorName) {
        return ctorName;
    }

    return typeof value;
}
