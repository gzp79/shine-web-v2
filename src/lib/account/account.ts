import { config } from '@config';

function getLogoutUrl(terminateAll: boolean, redirect: string): string {
    const redirectUrl = encodeURIComponent(`${config.webUrl}${redirect}`);
    const errorUrl = encodeURIComponent(`${config.webUrl}/error`);
    return `${config.identityUrl}/auth/logout?redirectUrl=${redirectUrl}&errorUrl=${errorUrl}&terminateAll=${terminateAll}`;
}

export const logoutUrl = getLogoutUrl(false, '/');
export const logoutAllUrl = getLogoutUrl(true, '/');
