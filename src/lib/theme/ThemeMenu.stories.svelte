<script module lang="ts">
    import { withinPopover } from '@sb/models/popover';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect, userEvent, waitFor, within } from 'storybook/test';
    import { tick } from 'svelte';
    import ThemeMenu from '@lib/theme/ThemeMenu.svelte';
    import { type Theme, createThemeContext, themeList } from '@lib/theme/theme.svelte';
    import { DropdownGroup, DropdownItem, DropdownMenu, DropdownSeparator } from '@lib/ui/atoms/dropdown-menu';

    const { Story } = defineMeta({
        title: 'Components/App/ThemeMenu',
        component: ThemeMenu,
        play: async ({ canvasElement }) => {
            expect(canvasElement).toBeDefined();
        }
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

<Story
    name="ThemeSelector"
    play={async ({ canvasElement }) => {
        const canvas = withinPopover();

        // Open theme submenu
        const themeSubTrigger = await waitFor(async () => {
            const themeSubTrigger = await canvas.getByRole('menuitem', { name: themeRegexp });
            await expect(themeSubTrigger).toBeVisible();
            return themeSubTrigger;
        });

        await userEvent.hover(themeSubTrigger!);
        await waitFor(async () => {
            const optionItem = await canvas.getByRole('menuitemradio', { name: regexps['system'] });
            await expect(optionItem).toBeVisible();
        });

        for (const option of themeList) {
            await expect(option).toBeDefined();
            const optionItem = await canvas.getByRole('menuitemradio', { name: regexps[option] });
            await userEvent.click(optionItem);
            await tick();
            await expect(theme.current).toBe(option);
        }

        const trigger = await within(canvasElement).getByRole('button');
        await userEvent.click(trigger!, { pointerEventsCheck: 0 });
        await waitFor(async () => {
            await expect(themeSubTrigger).not.toBeVisible();
        });
    }}
>
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
