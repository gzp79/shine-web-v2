import { config } from '@config';
import z from 'zod';
import { logAPI } from '@lib/loggers';
import { retryWithBackoff } from '@lib/utils';

type GameUrls = { jsUrl: string; wasmUrl: string };

const VersionSchema = z.object({ version: z.string() });

async function fetchGameUrls(): Promise<GameUrls> {
    return retryWithBackoff(async (retry) => {
        const res = await fetch(`${config.gameUrl}/latest.json`);
        if (!res.ok) retry(new Error(`Failed to fetch game version: ${res.status}`));
        const data = VersionSchema.parse(await res.json());
        return {
            jsUrl: `${config.gameUrl}/${data.version}/shine-web.js`,
            wasmUrl: `${config.gameUrl}/${data.version}/shine_game_bg.wasm`
        };
    });
}

const CACHE_DURATION = 60 * 60 * 1000;
type GameUrlCache = GameUrls & { fetchedAt: number };
let cache: GameUrlCache = { jsUrl: '', wasmUrl: '', fetchedAt: 0 };
let refreshInFlight: Promise<GameUrls> | null = null;

export const load = async () => {
    const now = Date.now();
    if (cache.fetchedAt + CACHE_DURATION >= now) {
        return { jsUrl: cache.jsUrl, wasmUrl: cache.wasmUrl };
    }

    if (!refreshInFlight) {
        refreshInFlight = fetchGameUrls()
            .then((urls) => {
                cache = { ...urls, fetchedAt: Date.now() };
                logAPI.info(`Game URLs refreshed: ${JSON.stringify(urls)}`);
                return urls;
            })
            .finally(() => {
                refreshInFlight = null;
            });
    }

    const urls = await refreshInFlight;
    return { jsUrl: urls.jsUrl, wasmUrl: urls.wasmUrl };
};
