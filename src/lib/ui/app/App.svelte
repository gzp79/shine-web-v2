<script module lang="ts">
    import { type Snippet } from 'svelte';
    import LanguageMenu from '@lib/i18n/LanguageMenu.svelte';
    import { t } from '@lib/i18n/i18n.svelte';
    import ThemeMenu from '@lib/theme/ThemeMenu.svelte';
    import Dropdown from '@lib/ui/atoms/dropdown-menu';
    import Settings from '@lib/ui/atoms/icons/common/Settings.svelte';

    export type AppProps = {
        showToolbar?: boolean;
        children: Snippet;
    };
</script>

<script lang="ts">
    let { showToolbar = true, children }: AppProps = $props();
</script>

<div data-slot="app" class="relative flex h-screen w-screen flex-col overflow-hidden">
    {#if showToolbar}
        <Dropdown.Menu>
            <Dropdown.Trigger class="absolute right-4 top-4 z-10" aria-label={$t('common.settings')}>
                <Settings />
            </Dropdown.Trigger>
            <Dropdown.Content class="w-32" align="start">
                <Dropdown.Label>{$t('common.settings')}</Dropdown.Label>
                <Dropdown.Separator />
                <ThemeMenu expandIcon="left" />
                <LanguageMenu expandIcon="left" />
                <Dropdown.Separator />
                <Dropdown.Item>LogoutMenu</Dropdown.Item>
            </Dropdown.Content>
        </Dropdown.Menu>
    {/if}
    {@render children()}
</div>

<div id="popover"></div>
