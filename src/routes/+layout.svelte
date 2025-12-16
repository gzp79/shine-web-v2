<script lang="ts">
    import { afterNavigate } from '$app/navigation';
    import { refreshLanguage } from '@lib/i18n/i18n.svelte';
    import { refreshTheme } from '@lib/theme/theme.svelte';
    import App from '@lib/ui/app/App.svelte';
    import '../app.css';

    let { children } = $props();

    afterNavigate(() => {
        refreshTheme();
        refreshLanguage();
    });
</script>

<App>
    {@render children()}
</App>
