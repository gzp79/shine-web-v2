import { config } from '@config';
import z from 'zod';
import { IdentityKindSchema } from '@lib/server/api/identity';
import { joinURL } from '@lib/utils';

export const authUrl = {
    providers() {
        return joinURL(config.identityUrl, '/api/auth/providers');
    },
    myInfo() {
        return joinURL(config.identityUrl, '/api/auth/user/info');
    }
};

export const ProviderSchema = z.object({
    providers: z.array(z.string())
});
export type Provider = z.infer<typeof ProviderSchema>;

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
