<script lang="ts">
    import { type Snippet } from 'svelte';
    import { createLocaleContext } from '@lib/i18n';
    import { createThemeContext } from '@lib/theme';
    import App from '@lib/ui/app/App.svelte';
    import '../app.css';

    type Props = {
        children: Snippet;
    };

    let { children }: Props = $props();

    const theme = createThemeContext();
    const locale = createLocaleContext();
</script>

<App theme={theme.current} locale={locale.current}>
    {@render children()}
</App>
