<script module lang="ts">
    import { type Snippet } from 'svelte';
    import { type Theme } from '@lib/theme/_theme.svelte';
    import AppMenu, { createMenuContext } from './AppMenu.svelte';

    export type AppProps = {
        theme?: Theme;
        locale?: string;
        children: Snippet;
    };
</script>

<script lang="ts">
    let { theme = 'dark', locale = 'en', children }: AppProps = $props();

    createMenuContext();
</script>

<div
    id="app"
    data-lang={locale}
    data-theme={theme}
    data-slot="app"
    class="relative flex flex-col min-w-full min-h-full overflow-hidden bg-surface text-on-surface"
>
    <AppMenu />
    {@render children()}
    <div id="popover"></div>
</div>
