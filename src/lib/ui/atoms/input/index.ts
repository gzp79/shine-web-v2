export const inputVariantList = ['filled', 'outline', 'ghost'];
export type InputVariant = (typeof inputVariantList)[number];

export type LinkType = 'none' | 'hash' | 'internal' | 'external' | 'protocol';
export function getLinkType(url: string | null | undefined): LinkType {
    if (!url) return 'none';
    if (url.startsWith('#')) return 'hash';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) return 'external';
    if (url.startsWith('mailto:') || url.startsWith('tel:')) return 'protocol';
    return 'internal';
}
