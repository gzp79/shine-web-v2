import { config } from '@config';
import { joinURL, toQueryString } from '@lib/utils';

export const authPages = {
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
    },

    deleteUserUrl(params?: { redirectUrl: string; confirmation: string }): string {
        const queryString = toQueryString(
            params && {
                redirectUrl: `${config.webUrl}${params.redirectUrl}`,
                errorUrl: `${config.webUrl}/error`,
                confirmation: params.confirmation
            }
        );
        return joinURL(config.identityUrl, `auth/delete${queryString}`);
    }
};
