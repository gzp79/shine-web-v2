import { getRequestEvent, query } from '$app/server';
import { config } from '@config';
import z from 'zod';
import { logAPI } from '@lib/loggers';
import { createFetchError, parseResponse } from '@lib/utils';
import { retryWithBackoff } from '@lib/utils';
import type { CurrentUser } from './currentUser.svelte';

const IdentityKindSchema = z.enum(['user']);
//type IdentityKind = z.infer<typeof IdentityKindSchema>;

const CurrentUserDetailsSchema = z.object({
    kind: IdentityKindSchema,
    createdAt: z.iso.datetime(),
    email: z.email().optional()
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
//type CurrentUserDto = z.infer<typeof CurrentUserSchema>;

const LinkedIdentitySchema = z.object({
    //userId: string,
    provider: z.string(),
    providerUserId: z.string(),
    linkedAt: z.string().transform((str) => new Date(str)),
    name: z.string().optional(),
    email: z.string().optional()
});
export type LinkedIdentity = z.infer<typeof LinkedIdentitySchema>;

const LinkedIdentitiesSchema = z.object({
    links: z.array(LinkedIdentitySchema)
});
export type LinkedIdentities = z.infer<typeof LinkedIdentitiesSchema>;

export const queryCurrentUserInfo = query(async (): Promise<CurrentUser> => {
    const { cookies } = getRequestEvent();

    logAPI.trace('getCurrentUser...');
    const url = `${config.identityUrl}/api/auth/user/info?method=full`;
    logAPI.trace('getCurrentUser url', url);

    return await retryWithBackoff(async (retry) => {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                cookie: cookies
                    .getAll()
                    .map((c) => `${c.name}=${c.value}`)
                    .join('; ')
            }
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
    const { cookies } = getRequestEvent();

    logAPI.log('getLinkedIdentities...');
    const url = `${config.identityUrl}/identity/api/auth/user/links`;

    return await retryWithBackoff(async (retry) => {
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: {
                cookie: cookies
                    .getAll()
                    .map((c) => `${c.name}=${c.value}`)
                    .join('; ')
            }
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
