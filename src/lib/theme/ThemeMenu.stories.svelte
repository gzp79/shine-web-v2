<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import ThemeMenu from '@lib/theme/ThemeMenu.svelte';
    import { type Theme, createThemeContext, themeList } from '@lib/theme/_theme.svelte';
    import { DropdownGroup, DropdownItem, DropdownMenu, DropdownSeparator } from '@lib/ui/atoms/dropdown-menu';

    const { Story } = defineMeta({
        title: 'Components/App/ThemeMenu',
        component: ThemeMenu
    });
</script>

<script lang="ts">
    const themeRegexp = new RegExp('Theme|Téma', 'i');
    const regexps: Record<Theme, RegExp> = {
        system: new RegExp('System|Rendszer', 'i'),
        dark: new RegExp('Dark|Sötét', 'i'),
        light: new RegExp('Light|Világos', 'i')
    };

    let theme = createThemeContext();
</script>

<Story name="ThemeSelector">
    {#snippet template(args)}
        <DropdownMenu open={true} class="w-56" align="start" trigger={`Setting [${theme.current}]`}>
            <DropdownGroup heading="Settings">
                <DropdownItem>Profile</DropdownItem>
                <DropdownItem>Account</DropdownItem>
            </DropdownGroup>
            <DropdownSeparator />
            <ThemeMenu {...args} />
            <DropdownSeparator />
            <DropdownItem>Help</DropdownItem>
        </DropdownMenu>

        <div id="popover"></div>
    {/snippet}
</Story>
