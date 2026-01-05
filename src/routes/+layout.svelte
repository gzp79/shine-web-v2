<script lang="ts">
    import { invalidate } from '$app/navigation';
    import { type Snippet } from 'svelte';
    import { createLocaleContext } from '@lib/i18n/i18n.svelte';
    import { createThemeContext } from '@lib/theme/theme.svelte';
    import App from '@lib/ui/app/App.svelte';
    import { onTabVisible } from '@lib/utils';
    import '../app.css';

    type Props = {
        children: Snippet;
    };

    let { children }: Props = $props();

    const theme = createThemeContext();
    const locale = createLocaleContext();

    onTabVisible((visible) => {
        if (visible) {
            invalidate('data:theme&locale');
        }
    });
</script>

<App theme={theme.current} locale={locale.current}>
    {@render children()}
</App>
