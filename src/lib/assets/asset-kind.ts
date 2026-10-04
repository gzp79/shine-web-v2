export const ASSET_KINDS = ['model', 'tile-3d', 'texture-ui'] as const;
export type AssetKind = (typeof ASSET_KINDS)[number];

export function isAssetKind(kind: string): kind is AssetKind {
    return (ASSET_KINDS as readonly string[]).includes(kind);
}
