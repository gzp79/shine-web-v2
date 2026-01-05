import { loadLocale, loadTranslations } from '@lib/i18n/i18n.svelte';
import { loadTheme } from '@lib/theme/theme.svelte';

export const load = async (event) => {
    event.depends('data:theme&locale');

    const local = await loadLocale(event.data.i18n.locale);
    const theme = await loadTheme(event.data.theme);

    await loadTranslations(local, event.data.i18n.route);

    return {
        i18n: {
            local,
            route: event.data.i18n.route
        },
        theme
    };
};
