<script lang="ts">
    import type { Snippet } from 'svelte';
    import { getLocaleContext } from '@lib/i18n';
    import { getThemeContext } from '@lib/theme/_theme.svelte';
    import App from '@lib/ui/app/App.svelte';

    let { children }: { children: Snippet } = $props();

    const theme = getThemeContext();
    const locale = getLocaleContext();
</script>

<App theme={theme.current} locale={locale.current}>
    {@render children()}
</App>
