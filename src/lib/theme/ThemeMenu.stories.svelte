<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect, userEvent, within } from 'storybook/test';
    import { tick } from 'svelte';
    import ThemeMenu from '@lib/theme/ThemeMenu.svelte';
    import { type Theme, createThemeContext, themeList } from '@lib/theme/theme.svelte';
    import Dropdown from '@lib/ui/atoms/dropdown-menu';

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
    const waitForTransition = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));
</script>

<Story
    name="ThemeSelector"
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = await canvas.getByRole('button');

        // Open dropdown
        await userEvent.click(trigger!, { pointerEventsCheck: 0 });
        await waitForTransition();

        // Open theme submenu
        const themeSubTrigger = await canvas.getByRole('menuitem', { name: themeRegexp });
        await userEvent.hover(themeSubTrigger!);
        await waitForTransition();

        // Check each theme option
        for (const option of themeList) {
            await expect(option).toBeDefined();
            const optionItem = await canvas.getByRole('menuitemradio', { name: regexps[option] });
            await userEvent.click(optionItem);
            await tick();
            await expect(theme.current).toBe(option);
        }

        // Close dropdown
        await userEvent.click(trigger!, { pointerEventsCheck: 0 });
        await waitForTransition();
    }}
>
    {#snippet template(args)}
        <Dropdown.Menu>
            <Dropdown.Trigger>Setting [{theme.current}]</Dropdown.Trigger>
            <Dropdown.Content class="w-56" align="start">
                <Dropdown.Group>
                    <Dropdown.GroupHeading>Settings</Dropdown.GroupHeading>
                    <Dropdown.Item>Profile</Dropdown.Item>
                    <Dropdown.Item>Account</Dropdown.Item>
                </Dropdown.Group>
                <Dropdown.Separator />
                <ThemeMenu {...args} />
                <Dropdown.Separator />
                <Dropdown.Item>Help</Dropdown.Item>
            </Dropdown.Content>
        </Dropdown.Menu>

        <div id="popover"></div>
    {/snippet}
</Story>
