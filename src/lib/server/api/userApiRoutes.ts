import { config } from '@config';
import z from 'zod';
import { joinURL } from '@lib/utils';

/** Hard cap enforced by the identity service for a single public-info lookup. */
export const PUBLIC_USER_INFO_MAX_IDS = 100;

export const userApiRoutes = {
    publicUserInfo(): string {
        return joinURL(config.identityUrl, 'api/identities/users/info');
    }
};

export const PublicUserInfoSchema = z.object({
    name: z.string()
});
export type PublicUserInfo = z.infer<typeof PublicUserInfoSchema>;

export const PublicUserInfoResponseSchema = z.object({
    users: z.record(z.string(), PublicUserInfoSchema)
});
export type PublicUserInfoResponse = z.infer<typeof PublicUserInfoResponseSchema>;
