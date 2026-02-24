import { config } from '@config';
import z from 'zod';
import { IdentityKindSchema } from '@lib/server/api/identity';
import { joinURL, toQueryString } from '@lib/utils';

export const authUrl = {
    providers() {
        return joinURL(config.identityUrl, '/api/auth/providers');
    },
    myInfo() {
        return joinURL(config.identityUrl, '/api/auth/user/info');
    },

    tokenLoginUrl(params?: { redirectUrl: string; errorUrl: string }): string {
        const queryString = toQueryString(
            params && {
                redirectUrl: `${config.webUrl}${params.redirectUrl}`,
                errorUrl: `${config.webUrl}${params.errorUrl}`,
                rememberMe: 'true'
            }
        );
        return joinURL(config.identityUrl, `auth/token/login${queryString}`);
    },

    guestLoginUrl(params?: { captcha: string; redirectUrl: string }): string {
        const queryString = toQueryString(
            params && {
                redirectUrl: `${config.webUrl}${params.redirectUrl}`,
                errorUrl: `${config.webUrl}/error`,
                rememberMe: 'true',
                captcha: params.captcha
            }
        );
        return joinURL(config.identityUrl, `auth/guest/login${queryString}`);
    },

    emailLoginUrl(params?: { email: string; rememberMe: boolean; captcha: string; redirectUrl: string }): string {
        const queryString = toQueryString(
            params && {
                email: params.email,
                redirectUrl: `${config.webUrl}${params.redirectUrl}`,
                errorUrl: `${config.webUrl}/error`,
                rememberMe: params.rememberMe,
                captcha: params.captcha
            }
        );
        return joinURL(config.identityUrl, `auth/email/login${queryString}`);
    },

    externalLoginUrl(provider: string, params?: { rememberMe: boolean; captcha: string; redirectUrl: string }): string {
        const queryString = toQueryString(
            params && {
                redirectUrl: `${config.webUrl}${params.redirectUrl}`,
                errorUrl: `${config.webUrl}/error`,
                rememberMe: params.rememberMe,
                captcha: params.captcha
            }
        );
        return joinURL(config.identityUrl, `auth/${provider}/login${queryString}`);
    },

    externalLinkUrl(provider: string, params?: { redirectUrl: string }): string {
        const queryString = toQueryString(
            params && {
                redirectUrl: `${config.webUrl}${params.redirectUrl}`,
                errorUrl: `${config.webUrl}/error`
            }
        );
        return joinURL(config.identityUrl, `auth/${provider}/link${queryString}`);
    },

    logoutUrl(params?: { terminateAll: boolean; redirectUrl: string }): string {
        const queryString = toQueryString(
            params && {
                redirectUrl: `${config.webUrl}${params.redirectUrl}`,
                errorUrl: `${config.webUrl}/error`,
                terminateAll: params.terminateAll
            }
        );
        return joinURL(config.identityUrl, `auth/logout${queryString}`);
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
