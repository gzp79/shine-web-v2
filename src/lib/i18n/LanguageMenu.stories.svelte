<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect, userEvent, waitFor, within } from 'storybook/test';
    import LanguageMenu from '@lib/i18n/LanguageMenu.svelte';
    import { createLocaleContext, langList } from '@lib/i18n/i18n.svelte';
    import Dropdown from '@lib/ui/atoms/dropdown-menu';
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

    let language = createLocaleContext();
</script>

<Story
    name="LanguageSelector"
    play={async ({ canvasElement }) => {
        const portal = document.body.querySelector('#storybook-root') as HTMLElement;
        expect(portal).not.toBeNull();
        const canvas = within(portal);

        const langSubTrigger = await waitFor(async () => {
            const langSubTrigger = await canvas.getByRole('menuitem', { name: langRegexps[language.current] });
            await expect(langSubTrigger).toBeVisible();
            return langSubTrigger;
        });

        await userEvent.hover(langSubTrigger!);
        await waitFor(async () => {
            const optionItem = await canvas.getByRole('menuitemradio', { name: langRegexps['en'] });
            await expect(optionItem).toBeVisible();
        });

        for (const langOption of langList) {
            const optionItem = await canvas.getByRole('menuitemradio', { name: langRegexps[langOption] });
            await userEvent.click(optionItem);
            await waitForCookie('lang', langOption);
            await expect(language.current).toBe(langOption);
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
        <Dropdown.Menu to="#storybook-root" open={true} class="w-56" align="start">
            {#snippet trigger()}
                Settings [{language.current}]
            {/snippet}

            <Dropdown.Group heading="Settings">
                <Dropdown.Item>Profile</Dropdown.Item>
                <Dropdown.Item>Account</Dropdown.Item>
            </Dropdown.Group>
            <Dropdown.Separator />
            <LanguageMenu {...args} />
            <Dropdown.Separator />
            <Dropdown.Item>Help</Dropdown.Item>
        </Dropdown.Menu>
    {/snippet}
</Story>
