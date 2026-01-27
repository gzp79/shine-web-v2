import { query } from '$app/server';
import { config } from '@config';
import z from 'zod';
import { logAPI } from '@lib/loggers';
import { createFetchError, getPassThroughHeaders, parseResponse, retryWithBackoff } from '@lib/utils';

const ProviderSchema = z.object({
    providers: z.array(z.string())
});
export type Provider = z.infer<typeof ProviderSchema>;

export const queryExternalLoginProviders = query(async (): Promise<string[]> => {
    logAPI.log('getExternalLoginProviders...');
    const url = `${config.identityUrl}/api/auth/providers`;
    const headers = getPassThroughHeaders();

    return await retryWithBackoff(async (retry) => {
        const response = await fetch(url, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            const err = await createFetchError(response, 'Failed to get external login providers');
            logAPI.error(`getExternalLoginProviders failed, retry ${retry.current}/${retry.limit}`, err);
            if (response.status >= 500) {
                return retry(err);
            } else {
                throw err;
            }
        }

        const tokens = await parseResponse(ProviderSchema, response);
        logAPI.log('getExternalLoginProviders completed,', tokens);
        return tokens.providers;
    });
});

export const querySanitizedReturnUrl = query(z.string(), async (rawUrl: string): Promise<string> => {
    console.log('Raw return URL:', rawUrl);
    try {
        const parsed = new URL(rawUrl, 'http://localhost');
        if (parsed.origin === 'http://localhost' && rawUrl.startsWith('/')) {
            const sanitized = parsed.pathname + parsed.search + parsed.hash;
            console.info('Sanitized return URL:', sanitized);
            return sanitized;
        }
    } catch (e) {
        console.error(`Failed to parse return URL (${rawUrl}):`, e);
    }
    console.info('Returning default /game URL');
    return '/game';
});
