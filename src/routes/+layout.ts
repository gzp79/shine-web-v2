import { loadTheme } from '@lib/theme/theme.svelte';

export const load = async ({ data }) => {
    await loadTheme(data.theme);
};
