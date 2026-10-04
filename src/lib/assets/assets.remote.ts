import { query } from '$app/server';
import { config } from '@config';
import z from 'zod';
import { logAPI } from '@lib/loggers';
import { getMockWorkerHeader, throwRemoteHttpError } from '@lib/server/utils';
import { createFetchError, parseResponse, retryWithBackoff } from '@lib/utils';

const VersionSchema = z.object({ version: z.string() });

export const ASSET_KINDS = ['model', 'tile-3d', 'texture-ui'] as const;
export type AssetKind = (typeof ASSET_KINDS)[number];

function isAssetKind(kind: string): kind is AssetKind {
    return (ASSET_KINDS as readonly string[]).includes(kind);
}

interface ManifestEntry {
    path: string;
    kind: AssetKind;
    // Alternative encodings of the same asset (e.g. a jpg fallback for a webp path), preference order.
    variants: string[];
}
type Manifest = Record<string, ManifestEntry>;

// Raw manifest JSON before kind validation: same shape, but kind is whatever the server sent.
type RawManifest = Record<string, { path: string; kind: string; variants?: string[] }>;

// Entries with an unrecognized kind are dropped rather than surfaced with a bogus kind — an older
// client shouldn't fail hard just because the manifest knows about a newer asset kind.
function validatedManifest(raw: RawManifest): Manifest {
    const manifest: Manifest = {};
    for (const [name, entry] of Object.entries(raw)) {
        if (isAssetKind(entry.kind))
            manifest[name] = { path: entry.path, kind: entry.kind, variants: entry.variants ?? [] };
        else logAPI.warn(`[AssetCatalog] skipping asset "${name}" with unknown kind "${entry.kind}"`);
    }
    return manifest;
}

// URLs in preference order: the primary path first, then its variants (e.g. a legacy format fallback).
function urlsOf(entry: ManifestEntry): string[] {
    return [entry.path, ...entry.variants].map((relative) => config.assetUrl + '/' + relative);
}

async function fetchLatestAssetVersion(): Promise<string> {
    const latestUrl = `${config.assetUrl}/latest.json`;
    const response = await fetch(latestUrl, { method: 'GET', headers: getMockWorkerHeader() });

    if (!response.ok) {
        const error = await createFetchError(response, 'Failed to fetch the latest asset version');
        throw error;
    }
    const { version } = await parseResponse(VersionSchema, response);
    logAPI.info(`Latest asset version: [${version}]`);
    return version;
}

async function fetchAssetManifest(version: string): Promise<RawManifest> {
    const assetManifestUrl = `${config.assetUrl}/${version}/web/ui/assets.json`;
    logAPI.info(`Loading asset manifest from ${assetManifestUrl}`);
    const response = await fetch(assetManifestUrl, { headers: getMockWorkerHeader() });
    if (!response.ok) {
        const error = await createFetchError(response, 'Failed to fetch asset manifest');
        throw error;
    }

    return await response.json();
}

async function fetchGameAssetManifest(version: string): Promise<RawManifest> {
    const assetManifestUrl = `${config.assetUrl}/${version}/web/models/assets.json`;
    logAPI.info(`Loading game asset manifest from ${assetManifestUrl}`);
    const response = await fetch(assetManifestUrl, { headers: getMockWorkerHeader() });
    if (!response.ok) {
        const error = await createFetchError(response, 'Failed to fetch game asset manifest');
        throw error;
    }

    return await response.json();
}

type AssetManifest = {
    version: string;
    links: Manifest;
    fetchedAt: number;
};

/// Assets are global, user independent resources cached on the server.
let assetManifest: AssetManifest = { version: '', links: {}, fetchedAt: 0 };
let refreshInFlight: Promise<AssetManifest> | null = null;
let gameAssetManifest: AssetManifest = { version: '', links: {}, fetchedAt: 0 };
let gameRefreshInFlight: Promise<AssetManifest> | null = null;

async function getOrRefreshManifest(): Promise<AssetManifest> {
    const now = Date.now();
    if (assetManifest.fetchedAt + config.assetCacheDuration >= now) {
        return assetManifest;
    }

    if (!refreshInFlight) {
        refreshInFlight = retryWithBackoff(async () => {
            const version = await fetchLatestAssetVersion();
            if (version !== assetManifest.version) {
                logAPI.info(
                    `Asset version changed from [${assetManifest.version}] to [${version}], fetching new manifest.`
                );
            }
            const raw = await fetchAssetManifest(version);
            return {
                version,
                links: validatedManifest(raw),
                fetchedAt: Date.now()
            };
        })
            .then((result) => {
                assetManifest = result;
                return result;
            })
            .finally(() => {
                refreshInFlight = null;
            });
    }

    return refreshInFlight;
}

async function getOrRefreshGameManifest(): Promise<AssetManifest> {
    const now = Date.now();
    if (gameAssetManifest.fetchedAt + config.assetCacheDuration >= now) {
        return gameAssetManifest;
    }

    if (!gameRefreshInFlight) {
        gameRefreshInFlight = retryWithBackoff(async () => {
            const version = await fetchLatestAssetVersion();
            const raw = await fetchGameAssetManifest(version);
            return { version, links: validatedManifest(raw), fetchedAt: Date.now() };
        })
            .then((result) => {
                gameAssetManifest = result;
                return result;
            })
            .finally(() => {
                gameRefreshInFlight = null;
            });
    }

    return gameRefreshInFlight;
}

export const queryAssetManifest = query(async (): Promise<AssetManifest> => {
    try {
        return await getOrRefreshManifest();
    } catch (e) {
        throwRemoteHttpError(e, 'Asset service unavailable');
    }
});

/// Assets used by the game bundle. Kept separate from UI assets because they have a distinct manifest.
export const queryGameAssetManifest = query(async (): Promise<AssetManifest> => {
    try {
        return await getOrRefreshGameManifest();
    } catch (e) {
        throwRemoteHttpError(e, 'Asset service unavailable');
    }
});

/// Return the primary URL for an asset by its key.
export const queryAssetUrl = query(z.string(), async (key: string): Promise<string> => {
    try {
        const manifest = await getOrRefreshManifest();
        const entry = manifest.links[key];
        const url = entry ? urlsOf(entry)[0]! : config.assetUrl + '/not-found';
        logAPI.log(`Resolved asset key "${key}" to URL: ${url}`);
        return url;
    } catch (e) {
        throwRemoteHttpError(e, 'Asset service unavailable');
    }
});

/// Return the URLs for an asset by its key, in preference order: the primary path first,
/// then its variants (e.g. a legacy-format fallback for a browser that can't render the primary one).
export const queryAssetUrlVariants = query(z.string(), async (key: string): Promise<string[]> => {
    try {
        const manifest = await getOrRefreshManifest();
        const entry = manifest.links[key];
        const urls = entry ? urlsOf(entry) : [config.assetUrl + '/not-found'];
        logAPI.log(`Resolved asset key "${key}" to URLs: ${JSON.stringify(urls)}`);
        return urls;
    } catch (e) {
        throwRemoteHttpError(e, 'Asset service unavailable');
    }
});
