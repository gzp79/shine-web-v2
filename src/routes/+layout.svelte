<script lang="ts">
    import { afterNavigate } from '$app/navigation';
    import type { Snippet } from 'svelte';
    import { createLocaleContext, loadLocaleClientSide } from '@lib/i18n/i18n.svelte';
    import { createThemeContext, loadThemeClientSide } from '@lib/theme/theme.svelte';
    import App from '@lib/ui/app/App.svelte';
    import { onTabVisible } from '@lib/utils';
    import '../app.css';
    import type { LayoutData } from './$types';

    type Props = {
        data: LayoutData;
        children: Snippet;
    };

    let { data, children }: Props = $props();

    const theme = createThemeContext();
    const locale = createLocaleContext();

    $effect(() => {
        theme.current = loadThemeClientSide(data.theme);
        locale.current = loadLocaleClientSide(data.i18n.locale);
        locale.route = data.i18n.route;
    });

    onTabVisible((visible) => {
        if (visible) {
            theme.current = loadThemeClientSide();
            locale.current = loadLocaleClientSide();
        }
    });
    afterNavigate(() => {
        theme.current = loadThemeClientSide();
        locale.current = loadLocaleClientSide();
    });
</script>

<App theme={theme.current} locale={locale.current}>
    {@render children()}
</App>
