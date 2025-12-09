<script lang="ts">
    import { afterNavigate } from '$app/navigation';
    import { t } from '@lib/i18n/i18n.svelte';
    import { refreshLanguage } from '@lib/i18n/i18n.svelte';
    import { refreshTheme } from '@lib/theme/theme.svelte';

    let { children } = $props();

    afterNavigate(() => {
        refreshTheme();
        refreshLanguage();
    });
</script>

{$t('common.loading')}
{@render children()}
