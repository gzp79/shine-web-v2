import { config } from '@config';
import { joinURL } from '@lib/utils';

export const authUrl = {
    tokenLoginUrl(redirect: string): string {
        const params = new URLSearchParams({
            redirectUrl: `${config.webUrl}${redirect}`,
            errorUrl: `${config.webUrl}/error`,
            rememberMe: 'false'
        });
        return joinURL(config.identityUrl, `auth/token/login?${params}`);
    },

    guestLoginUrl(captcha: string, redirect: string): string {
        const params = new URLSearchParams({
            redirectUrl: `${config.webUrl}${redirect}`,
            errorUrl: `${config.webUrl}/error`,
            rememberMe: 'true',
            captcha
        });
        return joinURL(config.identityUrl, `auth/guest/login?${params}`);
    },

    emailLoginUrl(email: string, rememberMe: boolean, captcha: string, redirect: string): string {
        const params = new URLSearchParams({
            email,
            redirectUrl: `${config.webUrl}${redirect}`,
            errorUrl: `${config.webUrl}/error`,
            rememberMe: rememberMe.toString(),
            captcha
        });
        return joinURL(config.identityUrl, `auth/email/login?${params}`);
    },

    externalLoginUrl(provider: string, rememberMe: boolean, captcha: string, redirect: string): string {
        const params = new URLSearchParams({
            redirectUrl: `${config.webUrl}${redirect}`,
            errorUrl: `${config.webUrl}/error`,
            rememberMe: rememberMe.toString(),
            captcha
        });
        return joinURL(config.identityUrl, `auth/${provider}/login?${params}`);
    },

    externalLinkUrl(provider: string, redirect: string): string {
        const params = new URLSearchParams({
            redirectUrl: `${config.webUrl}${redirect}`,
            errorUrl: `${config.webUrl}/error`
        });
        return joinURL(config.identityUrl, `auth/${provider}/link?${params}`);
    },

    logoutUrl(terminateAll: boolean, redirect: string): string {
        const params = new URLSearchParams({
            redirectUrl: `${config.webUrl}${redirect}`,
            errorUrl: `${config.webUrl}/error`,
            terminateAll: terminateAll.toString()
        });
        return joinURL(config.identityUrl, `auth/logout?${params}`);
    }
};
