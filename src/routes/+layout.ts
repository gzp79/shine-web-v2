import { loadLanguage } from '@lib/i18n/i18n.svelte';
import { loadTheme } from '@lib/theme/theme.svelte';

export const load = async ({ data, url }) => {
    await loadLanguage(url, data.language);
    await loadTheme(data.theme);
};
