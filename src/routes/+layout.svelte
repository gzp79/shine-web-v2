<script lang="ts">
    import { page } from '$app/stores';
    import { type LanguageProps, loadLanguage } from '@lib/i18n/i18n.svelte';
    import { remote } from '@lib/remote';
    import { refreshTheme } from '@lib/theme/theme.svelte';
    import App from '@lib/ui/app/App.svelte';
    import '../app.css';

    let { children } = $props();
    let isInitialLanguageLoaded = $state(false);

    $effect(() => {
        const currentPathname = $page.url.pathname;

        refreshTheme();

        (async () => {
            try {
                const languageProps = await remote<LanguageProps>('i18n/loadLanguageQuery', {
                    pathname: currentPathname
                });
                await loadLanguage($page.url, languageProps);
            } catch (error) {
                console.error('Failed to load language:', error);
            } finally {
                if (!isInitialLanguageLoaded) {
                    isInitialLanguageLoaded = true;
                }
            }
        })();
    });
</script>

<App>
    {#if isInitialLanguageLoaded}
        {@render children()}
    {/if}
</App>
