<script lang="ts">
    import { type Snippet } from 'svelte';
    import { provideLocaleContext } from '@lib/i18n';
    import { provideThemeContext } from '@lib/theme';
    import App from '@lib/ui/app/App.svelte';
    import '../app.css';

    type Props = {
        children: Snippet;
    };

    let { children }: Props = $props();

    const theme = provideThemeContext();
    const locale = provideLocaleContext();
</script>

<App theme={theme.current} locale={locale.current}>
    {@render children()}
</App>
