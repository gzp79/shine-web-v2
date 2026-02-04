<script module lang="ts">
    import { type Snippet } from 'svelte';
    import LanguageMenu from '@lib/i18n/LanguageMenu.svelte';
    import { t } from '@lib/i18n/i18n.svelte';
    import ThemeMenu from '@lib/theme/ThemeMenu.svelte';
    import { type Theme } from '@lib/theme/theme.svelte';
    import { DropdownItem, DropdownLabel, DropdownMenu, DropdownSeparator } from '@lib/ui/atoms/dropdown-menu';
    import Settings from '@lib/ui/atoms/icons/common/Settings.svelte';
    import { fromComponent } from '../utils';

    export type AppProps = {
        theme?: Theme;
        locale?: string;
        showToolbar?: boolean;
        children: Snippet;
    };
</script>

<script lang="ts">
    let { showToolbar = true, theme = 'system', locale = 'en', children }: AppProps = $props();
</script>

<div
    id="app"
    data-lang={locale}
    data-theme={theme}
    data-slot="app"
    class="relative flex min-h-full min-w-full flex-col overflow-hidden"
>
    {#if showToolbar}
        <DropdownMenu
            trigger={fromComponent(Settings)}
            triggerStyle={{ class: 'absolute right-4 top-4 z-10' }}
            to="#popover"
            class="w-32"
            align="start"
            collisionPadding={16}
        >
            <DropdownLabel>{$t('common.settings')}</DropdownLabel>
            <DropdownSeparator />
            <ThemeMenu expandIcon="left" />
            <LanguageMenu expandIcon="left" />
            <DropdownSeparator />
            <DropdownItem>LogoutMenu</DropdownItem>
        </DropdownMenu>
    {/if}
    {@render children()}

    <div id="popover"></div>
</div>
