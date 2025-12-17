<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect, userEvent, within } from 'storybook/test';
    import LanguageMenu from '@lib/i18n/LanguageMenu.svelte';
    import { createLocaleContext, langList } from '@lib/i18n/i18n.svelte';
    import Dropdown from '@lib/ui/atoms/dropdown-menu';
    import { waitForCookie } from '@lib/utils';

    const { Story } = defineMeta({
        title: 'Components/LanguageMenu',
        component: LanguageMenu,
        play: async ({ canvasElement }) => {
            expect(canvasElement).toBeDefined();
        }
    });
</script>

<script lang="ts">
    const langRegexps: Record<string, RegExp> = {
        en: new RegExp('English', 'i'),
        hu: new RegExp('Magyar', 'i')
    };

    let language = createLocaleContext();
    const waitForTransition = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));
</script>

<Story
    name="LanguageSelector"
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = await canvas.getByRole('button');

        // Open dropdown
        await userEvent.click(trigger!, { pointerEventsCheck: 0 });
        await waitForTransition();

        // Open language submenu
        const langSubTrigger = await canvas.getByRole('menuitem', { name: langRegexps[language.current] });
        await userEvent.hover(langSubTrigger!);
        await waitForTransition();

        // Check each language option
        for (const langOption of langList) {
            const optionItem = await canvas.getByRole('menuitemradio', { name: langRegexps[langOption] });
            await userEvent.click(optionItem);
            await waitForCookie('lang', langOption);
            await expect(language.current).toBe(langOption);
            await expect(document.documentElement.lang).toBe(langOption);
        }

        // Close dropdown
        await userEvent.click(trigger!, { pointerEventsCheck: 0 });
        await waitForTransition();
    }}
>
    {#snippet template(args)}
        <Dropdown.Menu>
            <Dropdown.Trigger>Settings [{language.current}]</Dropdown.Trigger>
            <Dropdown.Content class="w-56" align="start">
                <Dropdown.Group>
                    <Dropdown.GroupHeading>Settings</Dropdown.GroupHeading>
                    <Dropdown.Item>Profile</Dropdown.Item>
                    <Dropdown.Item>Account</Dropdown.Item>
                </Dropdown.Group>
                <Dropdown.Separator />
                <LanguageMenu {...args} />
                <Dropdown.Separator />
                <Dropdown.Item>Help</Dropdown.Item>
            </Dropdown.Content>
        </Dropdown.Menu>

        <div id="popover"></div>
    {/snippet}
</Story>
