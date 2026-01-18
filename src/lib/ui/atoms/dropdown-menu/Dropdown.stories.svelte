<script module lang="ts">
    import { withinPopover } from '@sb/models/popover';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect, userEvent, waitFor, within } from 'storybook/test';
    import { tick } from 'svelte';
    import Dropdown from '@lib/ui/atoms/dropdown-menu';
    import Menu from '@lib/ui/atoms/dropdown-menu/Dropdown.svelte';

    const { Story } = defineMeta({
        title: 'Atoms/Menu/Dropdown',
        component: Menu,
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
    <Dropdown.Group heading="Account Settings">
        <Dropdown.Item>
            Profile
            <Dropdown.Shortcut>⇧⌘P</Dropdown.Shortcut>
        </Dropdown.Item>
        <Dropdown.Item>
            Billing
            <Dropdown.Shortcut>⌘B</Dropdown.Shortcut>
        </Dropdown.Item>
        <Dropdown.Item>
            Settings
            <Dropdown.Shortcut>⌘S</Dropdown.Shortcut>
        </Dropdown.Item>
        <Dropdown.Item>
            Keyboard shortcuts
            <Dropdown.Shortcut>⌘K</Dropdown.Shortcut>
        </Dropdown.Item>
    </Dropdown.Group>
    <Dropdown.Separator />
    <Dropdown.Item dangerous>
        Log out
        <Dropdown.Shortcut>⇧⌘Q</Dropdown.Shortcut>
    </Dropdown.Item>
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
    <Dropdown.Item>Team</Dropdown.Item>
    <Dropdown.Sub trigger="Invite users">
        <Dropdown.Item>Email</Dropdown.Item>
        <Dropdown.Item>Message</Dropdown.Item>
        <Dropdown.Item>Facebook</Dropdown.Item>
        <Dropdown.Item>SMS</Dropdown.Item>
        <Dropdown.Item>Chat</Dropdown.Item>
        <Dropdown.Item>Voice</Dropdown.Item>
        <Dropdown.Separator />
        <Dropdown.Item closeOnSelect={false}>More (won't close)...</Dropdown.Item>
    </Dropdown.Sub>
    <Dropdown.Item>
        New Team
        <Dropdown.Shortcut>⌘+T</Dropdown.Shortcut>
    </Dropdown.Item>
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
    <Dropdown.CheckboxGroup bind:value={checks}>
        <Dropdown.Group heading="Choose some [{checks.join(',')}]">
            {#each Array(4) as _, i (i)}
                <Dropdown.Separator />
                <Dropdown.CheckboxItem value="ch1" closeOnSelect={false}>Value 1</Dropdown.CheckboxItem>
                <Dropdown.CheckboxItem value="ch2" disabled closeOnSelect={false}>Value 2</Dropdown.CheckboxItem>
                <Dropdown.CheckboxItem value="ch3" closeOnSelect={false}>Value 3</Dropdown.CheckboxItem>
            {/each}
        </Dropdown.Group>
    </Dropdown.CheckboxGroup>
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
    <Dropdown.RadioGroup bind:value={radioValue}>
        <Dropdown.Group heading="Choose one [{radioValue}]">
            {#each Array(4) as _, i (i)}
                <Dropdown.Separator />
                <Dropdown.RadioItem value="r1" closeOnSelect={false}>Value 1</Dropdown.RadioItem>
                <Dropdown.RadioItem value="r2" disabled closeOnSelect={false}>Value 2</Dropdown.RadioItem>
                <Dropdown.RadioItem value="r3" closeOnSelect={false}>Value 3</Dropdown.RadioItem>
            {/each}
        </Dropdown.Group>
    </Dropdown.RadioGroup>
</Story>
