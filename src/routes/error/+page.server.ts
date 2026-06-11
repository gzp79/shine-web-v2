import { sanitizedReturnUrl } from '@lib/server/utils/_remote';

export const load = ({ url }: { url: URL }) => {
    const raw = url.searchParams.get('returnUrl');
    const returnUrl = raw ? sanitizedReturnUrl(raw) : null;
    return {
        returnUrl
    };
};
