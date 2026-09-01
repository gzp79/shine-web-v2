import { query } from '$app/server';
import { config } from '@config';
import z from 'zod';
import { logAPI } from '@lib/loggers';
import { getMockWorkerHeader, throwRemoteHttpError } from '@lib/server/utils';
import { createFetchError, parseResponse, retryWithBackoff } from '@lib/utils';

const VersionSchema = z.object({ version: z.string() });

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

async function fetchAssetManifest(version: string): Promise<Record<string, string>> {
    const assetManifestUrl = `${config.assetUrl}/${version}/web/ui/assets.json`;
    logAPI.info(`Loading asset manifest from ${assetManifestUrl}`);
    const response = await fetch(assetManifestUrl, { headers: getMockWorkerHeader() });
    if (!response.ok) {
        const error = await createFetchError(response, 'Failed to fetch asset manifest');
        throw error;
    }

    const links = await response.json();
    return links;
}

async function fetchGameAssetManifest(version: string): Promise<Record<string, string>> {
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
    links: Record<string, string>;
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
            const manifest = await fetchAssetManifest(version);
            return {
                version,
                links: manifest,
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
            const links = await fetchGameAssetManifest(version);
            return { version, links, fetchedAt: Date.now() };
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

/// Return the URL for an asset by its key.
export const queryAssetUrl = query(z.string(), async (key: string): Promise<string> => {
    try {
        const manifest = await getOrRefreshManifest();
        const relative = manifest.links[key] ?? 'not-found';
        const url = config.assetUrl + '/' + relative;
        logAPI.log(`Resolved asset key "${key}" to URL: ${url}`);
        return url;
    } catch (e) {
        throwRemoteHttpError(e, 'Asset service unavailable');
    }
});

export const queryAssetUrls = query(z.array(z.string()), async (keys: string[]): Promise<Record<string, string>> => {
    try {
        const manifest = await getOrRefreshManifest();
        const result: Record<string, string> = {};
        for (const key of keys) {
            const relative = manifest.links[key] ?? 'not-found';
            result[key] = config.assetUrl + '/' + relative;
        }
        logAPI.log(`Resolved asset keys: ${JSON.stringify(result)}`);
        return result;
    } catch (e) {
        throwRemoteHttpError(e, 'Asset service unavailable');
    }
});
