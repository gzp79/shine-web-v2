export const layoutWidthList = ['sm', 'md', 'lg', 'fit', 'full'] as const;
export type LayoutWidth = (typeof layoutWidthList)[number];

export const overflowList = ['y', 'x', 'xy', 'hidden'] as const;
export type Overflow = (typeof overflowList)[number];

export const colorRotation = ['container', 'sub-container', 'surface'] as const;
export type ColorRotation = (typeof colorRotation)[number];

export function clampColorIndex(currentIndex: number): number {
    return currentIndex % colorRotation.length;
}
export function nextColorIndex(currentIndex: number): number {
    return (currentIndex + 1) % colorRotation.length;
}
export function prevColorIndex(currentIndex: number): number {
    return (currentIndex - 1 + colorRotation.length) % colorRotation.length;
}
