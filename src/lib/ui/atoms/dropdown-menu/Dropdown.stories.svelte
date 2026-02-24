<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
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

<Story name="SubMenu">
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

<Story name="Checkbox">
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

<Story name="Radio">
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
