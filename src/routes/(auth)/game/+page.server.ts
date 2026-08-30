import { config } from '@config';
import z from 'zod';
import { logAPI } from '@lib/loggers';
import { retryWithBackoff } from '@lib/utils';

const VersionSchema = z.object({ version: z.string() });

// The wasm is inlined into shine-web.js, so only the JS bundle URL is needed client-side.
async function fetchGameJsUrl(): Promise<string> {
    return retryWithBackoff(async (retry) => {
        const res = await fetch(`${config.gameUrl}/latest.json`);
        if (!res.ok) retry(new Error(`Failed to fetch game version: ${res.status}`));
        const data = VersionSchema.parse(await res.json());
        return `${config.gameUrl}/${data.version}/shine-web.js`;
    });
}

const CACHE_DURATION = 60 * 60 * 1000;
let cache = { jsUrl: '', fetchedAt: 0 };
let refreshInFlight: Promise<string> | null = null;

export const load = async () => {
    const now = Date.now();
    if (cache.fetchedAt + CACHE_DURATION >= now) {
        return { jsUrl: cache.jsUrl };
    }

    if (!refreshInFlight) {
        refreshInFlight = fetchGameJsUrl()
            .then((jsUrl) => {
                cache = { jsUrl, fetchedAt: Date.now() };
                logAPI.info(`Game URL refreshed: ${jsUrl}`);
                return jsUrl;
            })
            .finally(() => {
                refreshInFlight = null;
            });
    }

    const jsUrl = await refreshInFlight;
    return { jsUrl };
};
