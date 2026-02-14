import { query } from '$app/server';
import { config } from '@config';
import z from 'zod';
import { logAPI } from '@lib/loggers';
import { createFetchError, retryWithBackoff } from '@lib/utils';

async function fetchLatestAssetVersion(): Promise<string> {
    const latestUrl = `${config.assetUrl}/latest.json`;
    const response = await fetch(latestUrl, { method: 'GET' });

    if (!response.ok) {
        const error = await createFetchError(response, 'Failed to fetch the latest asset version');
        throw error;
    }
    const { version }: { version: string } = await response.json();
    logAPI.info(`Latest asset version: [${version}]`);

    return version;
}

async function fetchAssetManifest(version: string): Promise<Record<string, string>> {
    const assetManifestUrl = `${config.assetUrl}/${version}/web/ui/assets.json`;
    logAPI.info(`Loading asset manifest from ${assetManifestUrl}`);
    const response = await fetch(assetManifestUrl);
    if (!response.ok) {
        const error = await createFetchError(response, 'Failed to fetch asset manifest');
        throw error;
    }

    const links = await response.json();
    return links;
}

/// Cache resources on the server for this duration (in milliseconds)
const ASSET_CACHE_DURATION = 60 * 60 * 1000;

type AssetManifest = {
    version: string;
    links: Record<string, string>;
    fetchedAt: number;
};

/// Assets are global, user independent resources cached on the server.
let assetManifest: AssetManifest = { version: '', links: {}, fetchedAt: 0 };

async function getOrRefreshManifest(): Promise<AssetManifest> {
    const now = Date.now();
    if (assetManifest.fetchedAt + ASSET_CACHE_DURATION < now) {
        logAPI.info('Refreshing assets...');
        assetManifest = await retryWithBackoff(async () => {
            const version = await fetchLatestAssetVersion();
            if (version !== assetManifest.version) {
                logAPI.info(
                    `Asset version changed from [${assetManifest.version}] to [${version}], fetching new manifest.`
                );
                const manifest = await fetchAssetManifest(version);
                return {
                    version,
                    links: manifest,
                    fetchedAt: now
                };
            } else {
                logAPI.info(`Asset version [${version}] unchanged, using cached manifest.`);
                return {
                    ...assetManifest,
                    fetchedAt: now
                };
            }
        });
    }
    return assetManifest;
}

export const queryAssetManifest = query(async (): Promise<AssetManifest> => {
    return await getOrRefreshManifest();
});

/// Return the URL for an asset by its key.
export const queryAssetUrl = query(z.string(), async (key: string): Promise<string> => {
    const manifest = await getOrRefreshManifest();
    const relative = manifest.links[key] ?? 'not-found';
    const url = config.assetUrl + '/' + relative;
    logAPI.log(`Resolved asset key "${key}" to URL: ${url}`);
    return url;
});

export const queryAssetUrls = query(z.array(z.string()), async (keys: string[]): Promise<Record<string, string>> => {
    const manifest = await getOrRefreshManifest();
    const result: Record<string, string> = {};
    for (const key of keys) {
        const relative = manifest.links[key] ?? 'not-found';
        result[key] = config.assetUrl + '/' + relative;
    }
    logAPI.log(`Resolved asset keys: ${JSON.stringify(result)}`);
    return result;
});
