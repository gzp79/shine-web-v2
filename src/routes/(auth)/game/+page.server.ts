import { config } from '@config';
import { logAPI } from '@lib/loggers';
import { retryWithBackoff } from '@lib/utils';

type GameUrls = { jsUrl: string; wasmUrl: string };

async function fetchGameUrls(): Promise<GameUrls> {
    const res = await fetch(`${config.gameUrl}/latest.json`);
    if (!res.ok) throw new Error(`Failed to fetch game version: ${res.status}`);
    const { version }: { version: string } = await res.json();
    return {
        jsUrl: `${config.gameUrl}/${version}/shine-web.js`,
        wasmUrl: `${config.gameUrl}/${version}/shine_game_bg.wasm`
    };
}

const CACHE_DURATION = 60 * 60 * 1000;
type GameUrlCache = GameUrls & { fetchedAt: number };
let cache: GameUrlCache = { jsUrl: '', wasmUrl: '', fetchedAt: 0 };

export const load = async () => {
    const now = Date.now();
    if (cache.fetchedAt + CACHE_DURATION < now) {
        logAPI.info('Refreshing game URLs...');
        const urls = await retryWithBackoff(fetchGameUrls);
        cache = { ...urls, fetchedAt: now };
        logAPI.info(`Game URLs refreshed: ${JSON.stringify(urls)}`);
    }
    return { jsUrl: cache.jsUrl, wasmUrl: cache.wasmUrl };
};
