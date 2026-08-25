<script module lang="ts">
    import { type Snippet } from 'svelte';
    import { type Theme } from '@lib/theme/_theme.svelte';
    import InputGroup from '@lib/ui/atoms/input/InputGroup.svelte';
    import AppMenu, { createMenuContext } from './AppMenu.svelte';
    import ConnectionStatus, { createConnectionStatusContext } from './ConnectionStatus.svelte';

    export type AppProps = {
        theme?: Theme;
        locale?: string;
        children: Snippet;
    };
</script>

<script lang="ts">
    let { theme = 'dark', locale = 'en', children }: AppProps = $props();

    createMenuContext();
    createConnectionStatusContext();
</script>

<div
    id="app"
    data-lang={locale}
    data-theme={theme}
    data-slot="app"
    class="relative flex flex-col min-w-full min-h-full overflow-hidden bg-surface text-on-surface"
>
    <InputGroup size="sm" variant="filled" class="absolute end-0 top-0 z-[10000] m-4">
        <AppMenu />
        <ConnectionStatus />
    </InputGroup>
    {@render children()}
    <div id="popover" class="z-[10000]"></div>
</div>
