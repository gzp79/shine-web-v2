<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { getLocaleContext, localeList } from '@lib/i18n';
    import LanguageMenu from '@lib/i18n/LanguageMenu.svelte';
    import { DropdownGroup, DropdownItem, DropdownMenu, DropdownSeparator } from '@lib/ui/atoms/dropdown-menu';

    const { Story } = defineMeta({
        title: 'Components/App/LanguageMenu',
        component: LanguageMenu
    });
</script>

<script lang="ts">
    const langRegexps: Record<string, RegExp> = {
        en: new RegExp('English', 'i'),
        hu: new RegExp('Magyar', 'i')
    };

    const locale = getLocaleContext();
</script>

<Story name="LanguageSelector">
    {#snippet template(args)}
        <DropdownMenu open={true} class="w-56" align="start" trigger={`Settings [${locale.current}]`}>
            <DropdownGroup heading="Settings">
                <DropdownItem>Profile</DropdownItem>
                <DropdownItem>Account</DropdownItem>
            </DropdownGroup>
            <DropdownSeparator />
            <LanguageMenu {...args} />
            <DropdownSeparator />
            <DropdownItem>Help</DropdownItem>
        </DropdownMenu>
    {/snippet}
</Story>
