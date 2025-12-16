<script lang="ts">
    import { page } from '$app/stores';
    import { translations } from '@lib/i18n/i18n.svelte';
    import { loadLanguage } from '@lib/i18n/i18n.remote';
    import { refreshTheme } from '@lib/theme/theme.svelte';
    import App from '@lib/ui/app/App.svelte';
    import '../app.css';

    let { children } = $props();

    const languageQuery = loadLanguage($page.url.pathname);

    $effect(() => {
        if (languageQuery.current) {
            translations.set(languageQuery.current.translations);
        }
        refreshTheme();
    });
</script>

<App>
    {#if languageQuery.loading && !languageQuery.current}
        <!-- Initial load: show a blank screen or a loading spinner -->
    {:else if languageQuery.error}
        <p style="color: red; margin: 1rem;">
            Error loading language: {languageQuery.error.message}
        </p>
        <!-- Render children with default/fallback language -->
        {@render children()}
    {:else}
        <!-- On initial load (after loading) and on subsequent navigations, render the content.
             On navigation, languageQuery.current will hold the *old* data while the new
             data is loading, preventing any flickering. -->
        {@render children()}
    {/if}
</App>
