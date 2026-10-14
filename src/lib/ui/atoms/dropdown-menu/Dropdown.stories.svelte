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
    } from '#lib/ui/atoms/dropdown-menu';

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

    // Several groups of distinct values: enough rows to exercise scrolling, while keeping every
    // value unique so selecting one row cannot toggle its twins in the other groups.
    const groupList = [1, 2, 3, 4];
    const itemList = [1, 2, 3];
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
            {#each groupList as group (group)}
                <DropdownSeparator />
                {#each itemList as item (item)}
                    <DropdownCheckboxItem value="ch{group}-{item}" disabled={item === 2} closeOnSelect={false}
                        >Value {group}.{item}</DropdownCheckboxItem
                    >
                {/each}
            {/each}
        </DropdownGroup>
    </DropdownCheckboxGroup>
</Story>

<Story name="Radio">
    <DropdownRadioGroup bind:value={radioValue}>
        <DropdownGroup heading="Choose one [{radioValue}]">
            {#each groupList as group (group)}
                <DropdownSeparator />
                {#each itemList as item (item)}
                    <DropdownRadioItem value="r{group}-{item}" disabled={item === 2} closeOnSelect={false}
                        >Value {group}.{item}</DropdownRadioItem
                    >
                {/each}
            {/each}
        </DropdownGroup>
    </DropdownRadioGroup>
</Story>
