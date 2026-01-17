export const containerColorList = ['surface', 'container', 'sub-container'] as const;
export type ContainerColor = (typeof containerColorList)[number];

export const actionColorList = ['primary', 'secondary', 'info', 'warning', 'danger', 'success'] as const;
export type ActionColor = (typeof actionColorList)[number];

export const sizeList = ['xs', 'sm', 'md', 'lg'] as const;
export type Size = (typeof sizeList)[number];

export const iconSizeList = [...sizeList, 'full', 'text'] as const;
export type IconSize = (typeof iconSizeList)[number];

export type AriaLive = 'off' | 'assertive' | 'polite' | undefined | null;

export * from './_spacing';
export * from './_responsive-prop';
