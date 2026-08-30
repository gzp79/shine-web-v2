export const containerColorList = ['surface', 'container', 'sub-container'] as const;
export type ContainerColor = (typeof containerColorList)[number];

export const actionColorList = ['primary', 'secondary', 'info', 'warning', 'danger', 'success'] as const;
export type ActionColor = (typeof actionColorList)[number];

// Meaning-free categorical palette (warm -> cool heat buckets) for distinguishing series, users,
// tags, etc. Each bucket has the same shape as an action color: base, `-1`, `-2` and `on-`.
export const dataColorList = ['data-1', 'data-2', 'data-3', 'data-4', 'data-5', 'data-6', 'data-7', 'data-8'] as const;
export type DataColor = (typeof dataColorList)[number];

export const sizeList = ['xs', 'sm', 'md', 'lg'] as const;
export type Size = (typeof sizeList)[number];

export const iconSizeList = [...sizeList, 'full', 'text'] as const;
export type IconSize = (typeof iconSizeList)[number];

export type AriaLive = 'off' | 'assertive' | 'polite' | undefined | null;

export * from './_spacing';
export * from './_responsive-prop';
