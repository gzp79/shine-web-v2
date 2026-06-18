<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import LanguageMenu, { type LanguageMenuProps } from '@lib/i18n/LanguageMenu.svelte';
    import { DropdownGroup, DropdownItem, DropdownMenu, DropdownSeparator } from '@lib/ui/atoms/dropdown-menu';

    const { Story } = defineMeta({
        title: 'Components/App/LanguageMenu',
        component: LanguageMenu,
        render: template
    });
</script>

{#snippet template(args: LanguageMenuProps)}
    <DropdownMenu open={true} class="w-56" align="start" trigger="Settings">
        <DropdownGroup heading="Settings">
            <DropdownItem>Profile</DropdownItem>
            <DropdownItem>Account</DropdownItem>
        </DropdownGroup>
        <DropdownSeparator />
        <LanguageMenu {...args} />
        <DropdownSeparator />
        <DropdownItem>Help</DropdownItem>
    </DropdownMenu>

    <div id="popover"></div>
{/snippet}

<Story name="LanguageSelector" />
