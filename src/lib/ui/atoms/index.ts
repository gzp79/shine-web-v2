export const containerColorList = ['surface', 'container', 'sub-container'] as const;
export type ContainerColor = (typeof containerColorList)[number];

export const actionColorList = ['primary', 'secondary', 'info', 'warning', 'danger', 'success'] as const;
export type ActionColor = (typeof actionColorList)[number];

export const sizeList = ['xs', 'sm', 'md', 'lg'] as const;
export type Size = (typeof sizeList)[number];

export const iconSizeList = [...sizeList, 'full', 'text'] as const;
export type IconSize = (typeof iconSizeList)[number];

export const spacingList = [
    0, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56
] as const;
export type Spacing = (typeof spacingList)[number];

export { type ResponsiveSpacing, toSpacingClasses } from './_spacing';
export { type ResponsiveProp, toResponsiveClass } from './_responsive-prop';

export type AriaLive = 'off' | 'assertive' | 'polite' | undefined | null;
