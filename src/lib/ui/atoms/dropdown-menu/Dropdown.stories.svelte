<script module lang="ts">
    import { withinPopover } from '@sb/models/popover';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect, userEvent, waitFor, within } from 'storybook/test';
    import { tick } from 'svelte';
    import {
        DropdownCheckboxGroup,
        DropdownCheckboxItem,
        DropdownGroup,
        DropdownItem,
        DropdownMenu,
        DropdownRadioGroup,
        DropdownRadioItem,
        DropdownSeparator,
        DropdownShortcut,
        DropdownSubMenu
    } from '@lib/ui/atoms/dropdown-menu';

    const { Story } = defineMeta({
        title: 'Atoms/Menu/Dropdown',
        component: DropdownMenu,
        args: {
            class: 'w-56',
            align: 'start',
            trigger: 'Open menu',
            open: true
        },
        play: async ({ canvasElement }) => {
            expect(canvasElement).toBeDefined();
        }
    });
</script>

<script lang="ts">
    let checks = $state<string[]>([]);
    let radioValue = $state<string>('');
</script>

<Story name="Simple">
    <DropdownGroup heading="Account Settings">
        <DropdownItem>
            Profile
            <DropdownShortcut>⇧⌘P</DropdownShortcut>
        </DropdownItem>
        <DropdownItem>
            Billing
            <DropdownShortcut>⌘B</DropdownShortcut>
        </DropdownItem>
        <DropdownItem>
            Settings
            <DropdownShortcut>⌘S</DropdownShortcut>
        </DropdownItem>
        <DropdownItem>
            Keyboard shortcuts
            <DropdownShortcut>⌘K</DropdownShortcut>
        </DropdownItem>
    </DropdownGroup>
    <DropdownSeparator />
    <DropdownItem dangerous>
        Log out
        <DropdownShortcut>⇧⌘Q</DropdownShortcut>
    </DropdownItem>
</Story>

<Story
    name="SubMenu"
    play={async () => {
        const canvas = withinPopover();

        const subTrigger = await canvas.getByRole('menuitem', { name: 'Invite users' });
        await userEvent.hover(subTrigger!);
        const subItem = await waitFor(async () => {
            const subItem = await canvas.getByRole('menuitem', { name: 'Chat' });
            await expect(subItem).toBeVisible();
            return subItem;
        });

        await userEvent.click(subItem!);
        await tick();
        await waitFor(async () => {
            await expect(subItem).not.toBeVisible();
            await expect(subTrigger).not.toBeVisible();
        });
    }}
>
    <DropdownItem>Team</DropdownItem>
    <DropdownSubMenu trigger="Invite users">
        <DropdownItem>Email</DropdownItem>
        <DropdownItem>Message</DropdownItem>
        <DropdownItem>Facebook</DropdownItem>
        <DropdownItem>SMS</DropdownItem>
        <DropdownItem>Chat</DropdownItem>
        <DropdownItem>Voice</DropdownItem>
        <DropdownSeparator />
        <DropdownItem closeOnSelect={false}>More (won't close)...</DropdownItem>
    </DropdownSubMenu>
    <DropdownItem>
        New Team
        <DropdownShortcut>⌘+T</DropdownShortcut>
    </DropdownItem>
</Story>

<Story
    name="Checkbox"
    play={async ({ canvasElement }) => {
        const canvas = withinPopover();
        const heading = await canvas.getByText(/Choose some .*/);

        const item1 = (await canvas.getAllByRole('menuitemcheckbox', { name: 'Value 1' }))[0];
        await userEvent.click(item1!);
        await tick();
        const item3 = (await canvas.getAllByRole('menuitemcheckbox', { name: 'Value 3' }))[0];
        await userEvent.click(item3!);
        await tick();
        await expect(heading).toHaveTextContent('Choose some [ch1,ch3]');
        await userEvent.click(item3!);
        await tick();
        await expect(heading).toHaveTextContent('Choose some [ch1]');

        const trigger = await within(canvasElement).getByRole('button');
        await userEvent.click(trigger!, { pointerEventsCheck: 0 });
        await waitFor(async () => {
            await expect(heading).not.toBeVisible();
        });
    }}
>
    <DropdownCheckboxGroup bind:value={checks}>
        <DropdownGroup heading="Choose some [{checks.join(',')}]">
            {#each Array(4) as _, i (i)}
                <DropdownSeparator />
                <DropdownCheckboxItem value="ch1" closeOnSelect={false}>Value 1</DropdownCheckboxItem>
                <DropdownCheckboxItem value="ch2" disabled closeOnSelect={false}>Value 2</DropdownCheckboxItem>
                <DropdownCheckboxItem value="ch3" closeOnSelect={false}>Value 3</DropdownCheckboxItem>
            {/each}
        </DropdownGroup>
    </DropdownCheckboxGroup>
</Story>

<Story
    name="Radio"
    play={async ({ canvasElement }) => {
        const canvas = withinPopover();
        const heading = await canvas.getByText(/Choose one .*/);

        const item = (await canvas.getAllByRole('menuitemradio', { name: 'Value 1' }))[0];
        await userEvent.click(item!);
        await tick();
        await expect(heading).toHaveTextContent('Choose one [r1]');

        const trigger = await within(canvasElement).getByRole('button');
        await userEvent.click(trigger!, { pointerEventsCheck: 0 });
        await waitFor(async () => {
            await expect(heading).not.toBeVisible();
        });
    }}
>
    <DropdownRadioGroup bind:value={radioValue}>
        <DropdownGroup heading="Choose one [{radioValue}]">
            {#each Array(4) as _, i (i)}
                <DropdownSeparator />
                <DropdownRadioItem value="r1" closeOnSelect={false}>Value 1</DropdownRadioItem>
                <DropdownRadioItem value="r2" disabled closeOnSelect={false}>Value 2</DropdownRadioItem>
                <DropdownRadioItem value="r3" closeOnSelect={false}>Value 3</DropdownRadioItem>
            {/each}
        </DropdownGroup>
    </DropdownRadioGroup>
</Story>
