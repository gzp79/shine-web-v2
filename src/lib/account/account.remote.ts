import { command, query } from '$app/server';
import { config } from '@config';
import z from 'zod';
import { logAPI } from '@lib/loggers';
import { async, createFetchError, getPassThroughHeaders, parseResponse, retryWithBackoff } from '@lib/utils';
import type { CurrentUser } from './currentUser.svelte';

const IdentityKindSchema = z.enum(['user']);

const CurrentUserDetailsSchema = z.object({
    kind: IdentityKindSchema,
    createdAt: z.iso.datetime().transform((dt) => new Date(dt)),
    email: z.email().nullable()
});

const CurrentUserSchema = z.object({
    userId: z.string(),
    name: z.string(),
    isLinked: z.boolean(),
    isEmailConfirmed: z.boolean(),
    roles: z.array(z.string()),
    sessionLength: z.number(),
    remainingSessionTime: z.number(),
    details: CurrentUserDetailsSchema
});

const LinkedIdentitySchema = z.object({
    userId: z.string(),
    provider: z.string(),
    providerUserId: z.string(),
    linkedAt: z.iso.datetime().transform((dt) => new Date(dt)),
    name: z.string().nullable(),
    email: z.string().nullable()
});
export type LinkedIdentity = z.infer<typeof LinkedIdentitySchema>;

const LinkedIdentitiesSchema = z.object({
    links: z.array(LinkedIdentitySchema)
});
export type LinkedIdentities = z.infer<typeof LinkedIdentitiesSchema>;

const ActiveSessionSchema = z.object({
    userId: z.string(),
    tokenHash: z.string(),
    fingerprint: z.string(),
    createdAt: z.iso.datetime().transform((dt) => new Date(dt)),
    agent: z.string(),
    country: z.string().nullable(),
    region: z.string().nullable(),
    city: z.string().nullable()
});
export type ActiveSession = z.infer<typeof ActiveSessionSchema>;

const ActiveSessionsSchema = z.object({
    sessions: z.array(ActiveSessionSchema)
});
export type ActiveSessions = z.infer<typeof ActiveSessionsSchema>;

export const queryCurrentUserInfo = query(async (): Promise<CurrentUser> => {
    logAPI.trace('getCurrentUser...');
    const url = `${config.identityUrl}/api/auth/user/info?method=full`;
    const headers = getPassThroughHeaders();

    return await retryWithBackoff(async (retry) => {
        const response = await fetch(url, {
            method: 'GET',
            headers
        });
        if (response.ok) {
            const user = await parseResponse(CurrentUserSchema, response);
            logAPI.info('getCurrentUser completed,', user);
            return {
                authenticated: true,
                id: user.userId,
                name: user.name,
                email: user.details.email || ''
            };
        } else if (response.status == 401) {
            logAPI.info('getCurrentUser failed with 401', await response.text());
            return { authenticated: false };
        } else {
            const err = await createFetchError(response, 'Failed to get current user');
            logAPI.error(`getCurrentUser failed, retry ${retry.current}/${retry.limit}`, err);
            return retry(err);
        }
    });
});

export const queryLinkedIdentities = query(async (): Promise<LinkedIdentity[]> => {
    logAPI.log('getLinkedIdentities...');
    const url = `${config.identityUrl}/api/auth/user/links`;
    const headers = getPassThroughHeaders();

    await async.delay(2000);

    return await retryWithBackoff(async (retry) => {
        const response = await fetch(url, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            const err = await createFetchError(response, 'Failed to get linked identities');
            logAPI.error(`getLinkedIdentities failed, retry ${retry.current}/${retry.limit}`, err);
            if (response.status >= 500) {
                return retry(err);
            } else {
                throw err;
            }
        }

        const identities = await parseResponse(LinkedIdentitiesSchema, response);
        logAPI.log('getLinkedIdentities completed,', identities);
        return identities.links;
    });
});

export const queryActiveSessions = query(async (): Promise<ActiveSession[]> => {
    logAPI.log('getActiveSessions...');
    const url = `${config.identityUrl}/api/auth/user/sessions`;
    const headers = getPassThroughHeaders();

    return await retryWithBackoff(async (retry) => {
        const response = await fetch(url, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            const err = await createFetchError(response, 'Failed to get active sessions');
            logAPI.error(`getActiveSessions failed, retry ${retry.current}/${retry.limit}`, err);
            if (response.status >= 500) {
                return retry(err);
            } else {
                throw err;
            }
        }

        const sessions = await parseResponse(ActiveSessionsSchema, response);
        logAPI.log('getActiveSessions completed,', sessions);
        return sessions.sessions;
    });
});

const TokenKindSchema = z.enum(['singleAccess', 'persistent', 'access', 'emailAccess']);
export type TokenKind = z.infer<typeof TokenKindSchema>;

const ActiveTokenSchema = z.object({
    userId: z.string(),
    tokenHash: z.string(),
    kind: TokenKindSchema,
    createdAt: z.iso.datetime().transform((dt) => new Date(dt)),
    expireAt: z.iso.datetime().transform((dt) => new Date(dt)),
    isExpired: z.boolean(),
    agent: z.string(),
    country: z.string().nullable(),
    region: z.string().nullable(),
    city: z.string().nullable()
});
export type ActiveToken = z.infer<typeof ActiveTokenSchema>;

const ActiveTokensSchema = z.object({
    tokens: z.array(ActiveTokenSchema)
});
export type ActiveTokens = z.infer<typeof ActiveTokensSchema>;

export const queryActiveTokens = query(async (): Promise<ActiveToken[]> => {
    logAPI.log('getActiveTokens...');
    const url = `${config.identityUrl}/api/auth/user/tokens`;
    const headers = getPassThroughHeaders();

    return await retryWithBackoff(async (retry) => {
        const response = await fetch(url, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            const err = await createFetchError(response, 'Failed to get active tokens');
            logAPI.error(`getActiveTokens failed, retry ${retry.current}/${retry.limit}`, err);
            if (response.status >= 500) {
                return retry(err);
            } else {
                throw err;
            }
        }

        const tokens = await parseResponse(ActiveTokensSchema, response);
        logAPI.log('getActiveTokens completed,', tokens);
        return tokens.tokens;
    });
});

export const revokeToken = command(z.string(), async (tokenHash: string) => {
    logAPI.log('revokeToken...', tokenHash);
    const url = `${config.identityUrl}/api/auth/user/tokens/${tokenHash}`;
    const headers = getPassThroughHeaders();

    return await retryWithBackoff(async (retry) => {
        const response = await fetch(url, {
            method: 'DELETE',
            headers
        });

        if (!response.ok) {
            const err = await createFetchError(response, 'Failed to revoke token');
            logAPI.error(`revokeToken failed, retry ${retry.current}/${retry.limit}`, err);
            if (response.status >= 500) {
                return retry(err);
            } else {
                throw err;
            }
        }

        logAPI.log('revokeToken completed');
        return undefined;
    });
});
