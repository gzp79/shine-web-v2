<script module lang="ts">
    import { withinPopover } from '@sb/models/popover';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect, userEvent, waitFor, within } from 'storybook/test';
    import { getLocaleContext, localeList } from '@lib/i18n';
    import LanguageMenu from '@lib/i18n/LanguageMenu.svelte';
    import { DropdownGroup, DropdownItem, DropdownMenu, DropdownSeparator } from '@lib/ui/atoms/dropdown-menu';
    import { waitForCookie } from '@lib/utils';

    const { Story } = defineMeta({
        title: 'Components/App/LanguageMenu',
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

    const locale = getLocaleContext();
</script>

<Story
    name="LanguageSelector"
    play={async ({ canvasElement }) => {
        const canvas = withinPopover();

        const langSubTrigger = await waitFor(async () => {
            const langSubTrigger = await canvas.getByRole('menuitem', { name: langRegexps[locale.current] });
            await expect(langSubTrigger).toBeVisible();
            return langSubTrigger;
        });

        await userEvent.hover(langSubTrigger!);
        await waitFor(async () => {
            const optionItem = await canvas.getByRole('menuitemradio', { name: langRegexps['en'] });
            await expect(optionItem).toBeVisible();
        });

        for (const langOption of localeList) {
            const optionItem = await canvas.getByRole('menuitemradio', { name: langRegexps[langOption] });
            await userEvent.click(optionItem);
            await waitForCookie('lang', langOption);
            await expect(locale.current).toBe(langOption);
            await expect(document.documentElement.lang).toBe(langOption);
        }

        const trigger = await within(canvasElement).getByRole('button');
        await userEvent.click(trigger!, { pointerEventsCheck: 0 });
        await waitFor(async () => {
            await expect(langSubTrigger).not.toBeVisible();
        });
    }}
>
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
