import { loadLocaleServerSide } from '@lib/i18n/i18n.svelte';
import { loadThemeServerSide } from '@lib/theme/theme.svelte';

export const load = async ({ url, cookies, request }) => {
    // Note: Server side load function allows to eliminate a flicker on initial page load by hydrating the
    // correct locale and theme already on the server side.

    const i18n = await loadLocaleServerSide(url, cookies, request.headers);
    const theme = await loadThemeServerSide(cookies);

    return {
        i18n,
        theme
    };
};
