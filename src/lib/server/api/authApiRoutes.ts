import { config } from '@config';
import z from 'zod';
import { joinURL, toQueryString } from '@lib/utils';

export const authApiRoutes = {
    providers() {
        return joinURL(config.identityUrl, 'api/auth/providers');
    },
    myInfo() {
        return joinURL(config.identityUrl, 'api/auth/user/info');
    },

    startEmailConfirmationUrl(): string {
        return joinURL(config.identityUrl, 'api/auth/user/email/confirm');
    },
    startEmailChange(): string {
        return joinURL(config.identityUrl, 'api/auth/user/email/change');
    },
    completeEmailOperation(params?: { token: string }): string {
        const queryString = toQueryString(params);
        return joinURL(config.identityUrl, `api/auth/user/email/complete${queryString}`);
    },

    linkedIdentities(): string {
        return joinURL(config.identityUrl, 'api/auth/user/links');
    },
    unlinkIdentity(provider: string, providerUserId: string): string {
        return joinURL(
            config.identityUrl,
            `api/auth/user/links/${encodeURIComponent(provider)}/${encodeURIComponent(providerUserId)}`
        );
    },

    activeSessions(): string {
        return joinURL(config.identityUrl, 'api/auth/user/sessions');
    },

    activeTokens(): string {
        return joinURL(config.identityUrl, 'api/auth/user/tokens');
    },
    revokeToken(tokenHash: string): string {
        return joinURL(config.identityUrl, `api/auth/user/tokens/${encodeURIComponent(tokenHash)}`);
    }
};

export const ProviderSchema = z.object({
    providers: z.array(z.string())
});
export type Provider = z.infer<typeof ProviderSchema>;

export const IdentityKindSchema = z.enum(['user']);
export type IdentityKind = z.infer<typeof IdentityKindSchema>;

export const CurrentUserDetailsSchema = z.object({
    kind: IdentityKindSchema,
    createdAt: z.iso.datetime().transform((dt) => new Date(dt)),
    email: z.email().nullable()
});

export const CurrentUserSchema = z.object({
    userId: z.string(),
    name: z.string(),
    isLinked: z.boolean(),
    isEmailConfirmed: z.boolean(),
    roles: z.array(z.string()),
    sessionLength: z.number(),
    remainingSessionTime: z.number(),
    details: CurrentUserDetailsSchema
});
