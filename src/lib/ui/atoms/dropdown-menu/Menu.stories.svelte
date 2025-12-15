<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect, userEvent, within } from 'storybook/test';
    import { tick } from 'svelte';
    import Dropdown from '@lib/ui/atoms/dropdown-menu';
    import Menu from '@lib/ui/atoms/dropdown-menu/Menu.svelte';

    const { Story } = defineMeta({
        title: 'Atoms/Menu/Dropdown',
        component: Menu,
        play: async ({ canvasElement }) => {
            expect(canvasElement).toBeDefined();
        }
    });
</script>

<script lang="ts">
    let checks = $state<string[]>([]);
    let radioValue = $state<string>('');

    const waitForTransition = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));
</script>

<Story name="Simple">
    <Dropdown.Trigger>Open</Dropdown.Trigger>
    <Dropdown.Content class="w-56" align="start">
        <Dropdown.Group>
            <Dropdown.GroupHeading>Account Settings</Dropdown.GroupHeading>
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
    </Dropdown.Content>

    <div id="popover"></div>
</Story>

<Story name="SubMenu">
    <Dropdown.Trigger>Open</Dropdown.Trigger>
    <Dropdown.Content class="w-56" align="start">
        <Dropdown.Item>Team</Dropdown.Item>
        <Dropdown.Sub>
            <Dropdown.SubTrigger>Invite users</Dropdown.SubTrigger>
            <Dropdown.SubContent>
                <Dropdown.Item>Email</Dropdown.Item>
                <Dropdown.Item>Message</Dropdown.Item>
                <Dropdown.Item>Facebook</Dropdown.Item>
                <Dropdown.Item>SMS</Dropdown.Item>
                <Dropdown.Item>Chat</Dropdown.Item>
                <Dropdown.Item>Voice</Dropdown.Item>
                <Dropdown.Separator />
                <Dropdown.Item closeOnSelect={false}>More (won't close)...</Dropdown.Item>
            </Dropdown.SubContent>
        </Dropdown.Sub>
        <Dropdown.Item>
            New Team
            <Dropdown.Shortcut>⌘+T</Dropdown.Shortcut>
        </Dropdown.Item>
    </Dropdown.Content>
    <div id="popover"></div>
</Story>

<Story
    name="Checkbox"
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = await canvas.getByRole('button');
        await userEvent.click(trigger!, { pointerEventsCheck: 0 });
        await waitForTransition();

        const item1 = (await canvas.getAllByRole('menuitemcheckbox', { name: 'Value 1' }))[0];
        await userEvent.click(item1!);
        await tick();
        const item3 = (await canvas.getAllByRole('menuitemcheckbox', { name: 'Value 3' }))[0];
        await userEvent.click(item3!);
        await tick();
        await expect(trigger).toHaveTextContent('Open [ch1, ch3]');
        await userEvent.click(item3!);
        await tick();
        await expect(trigger).toHaveTextContent('Open [ch1]');

        await userEvent.click(trigger!, { pointerEventsCheck: 0 });
        await waitForTransition();
        await expect(item1).not.toBeVisible();
    }}
>
    <Dropdown.Trigger>Open [{checks.join(', ')}]</Dropdown.Trigger>

    <Dropdown.Content class="w-56" align="start">
        <Dropdown.CheckboxGroup bind:value={checks}>
            <Dropdown.GroupHeading>Choose some</Dropdown.GroupHeading>
            {#each Array(4) as _, i (i)}
                <Dropdown.Separator />
                <Dropdown.CheckboxItem value="ch1" closeOnSelect={false}>Value 1</Dropdown.CheckboxItem>
                <Dropdown.CheckboxItem value="ch2" disabled closeOnSelect={false}>Value 2</Dropdown.CheckboxItem>
                <Dropdown.CheckboxItem value="ch3" closeOnSelect={false}>Value 3</Dropdown.CheckboxItem>
            {/each}
        </Dropdown.CheckboxGroup>
    </Dropdown.Content>

    <div id="popover"></div>
</Story>

<Story
    name="Radio"
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = await canvas.getByRole('button');
        await userEvent.click(trigger!, { pointerEventsCheck: 0 });
        await waitForTransition();

        const item = (await canvas.getAllByRole('menuitemradio', { name: 'Value 1' }))[0];
        await userEvent.click(item!);
        await tick();
        await expect(trigger).toHaveTextContent('Open [r1]');

        await userEvent.click(trigger!, { pointerEventsCheck: 0 });
        await waitForTransition();
        await expect(item).not.toBeVisible();
    }}
>
    <Dropdown.Trigger>Open [{radioValue}]</Dropdown.Trigger>

    <Dropdown.Content class="w-56" align="start">
        <Dropdown.RadioGroup bind:value={radioValue}>
            <Dropdown.GroupHeading>Choose one</Dropdown.GroupHeading>
            {#each Array(4) as _, i (i)}
                <Dropdown.Separator />
                <Dropdown.RadioItem value="r1" closeOnSelect={false}>Value 1</Dropdown.RadioItem>
                <Dropdown.RadioItem value="r2" disabled closeOnSelect={false}>Value 2</Dropdown.RadioItem>
                <Dropdown.RadioItem value="r3" closeOnSelect={false}>Value 3</Dropdown.RadioItem>
            {/each}
        </Dropdown.RadioGroup>
    </Dropdown.Content>

    <div id="popover"></div>
</Story>
