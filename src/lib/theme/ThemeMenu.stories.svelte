<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import ThemeMenu, { type ThemeMenuProps } from '@lib/theme/ThemeMenu.svelte';
    import { DropdownGroup, DropdownItem, DropdownMenu, DropdownSeparator } from '@lib/ui/atoms/dropdown-menu';

    const { Story } = defineMeta({
        title: 'Components/App/ThemeMenu',
        component: ThemeMenu
    });
</script>

<Story name="ThemeSelector">
    {#snippet template(args: ThemeMenuProps)}
        <DropdownMenu open class="w-56" align="start" trigger="Settings">
            <DropdownGroup heading="Settings">
                <DropdownItem>Profile</DropdownItem>
                <DropdownItem>Account</DropdownItem>
            </DropdownGroup>
            <DropdownSeparator />
            <ThemeMenu {...args} />
            <DropdownSeparator />
            <DropdownItem>Help</DropdownItem>
        </DropdownMenu>
    {/snippet}
</Story>
