<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect, within } from 'storybook/test';
    import { tick } from 'svelte';
    import { sizeList } from '@lib/ui/atoms';
    import PropertyList, { type DescriptionListItem } from '@lib/ui/atoms/data/PropertyList.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';

    const { Story } = defineMeta({
        component: PropertyList,
        title: 'Atoms/Data/PropertyList',
        args: {},
        argTypes: {
            size: {
                control: { type: 'select' },
                options: ['default', ...sizeList],
                mapping: {
                    default: undefined
                }
            }
        },
        play: async ({ canvasElement }) => {
            expect(canvasElement).toBeDefined();
        }
    });

    const basicItems: DescriptionListItem[] = [
        { key: 'Username', value: 'john_doe' },
        { key: 'Email', value: 'john.doe@example.com' },
        { key: 'Role', value: 'Administrator' },
        { key: 'Status', value: 'Active' }
    ];
</script>

<script lang="ts">
    let data = $state(0);
</script>

<Story
    name="Default"
    args={{
        items: basicItems
    }}
/>

<Story name="Sizes">
    {#snippet template(args)}
        <Stack>
            {#each sizeList as size (size)}
                <PropertyList {...args} items={[{ key: 'Size', value: size }, ...basicItems]} {size} />
                <br />
            {/each}
        </Stack>
    {/snippet}
</Story>

<Story name="With Snippets">
    {#snippet template(args)}
        {#snippet buttonSnippet()}
            <Button size="xs" color="primary">Edit Profile</Button>
        {/snippet}

        {#snippet badgeSnippet()}
            <span class="badge badge-success">Verified</span>
        {/snippet}

        <PropertyList
            {...args}
            items={[
                { key: 'Username', value: 'john_doe' },
                { key: 'Email', value: 'john.doe@example.com' },
                { key: 'Status', value: badgeSnippet },
                { key: 'Actions', value: buttonSnippet }
            ]}
        />
    {/snippet}
</Story>

<Story name="With Custom Classes">
    {#snippet template(args)}
        <PropertyList
            {...args}
            items={[
                { key: 'Name', value: 'John Doe' },
                {
                    key: 'Status',
                    value: 'Active',
                    valueClass: 'font-semibold'
                },
                {
                    key: 'Error',
                    value: 'Failed authentication',
                    valueClass: 'text-on-danger font-bold'
                },
                {
                    key: 'Important',
                    value: 'System administrator',
                    keyClass: 'text-on-warning',
                    valueClass: 'text-on-warning'
                }
            ]}
        />
    {/snippet}
</Story>

<Story name="Long Content">
    {#snippet template(args)}
        {@const { wide, ...otherArgs } = args}
        <PropertyList
            wide
            {...otherArgs}
            items={[
                {
                    key: 'Short key',
                    value: 'This is a very long value that should demonstrate how the component handles text overflow and wrapping in the value column.'
                },
                {
                    key: 'This is a really long key name that might wrap',
                    value: 'Short value'
                },
                {
                    key: 'URL',
                    value: 'https://example.com/very/long/path/to/some/resource/that/might/need/scrolling'
                }
            ]}
        />
    {/snippet}
</Story>

<Story name="Null Filtering">
    {#snippet template(args)}
        <PropertyList
            {...args}
            items={[
                null,
                { key: 'Visible 1', value: 'This is shown (surrounded by nulls)' },
                null,
                { key: 'Visible 2', value: 'This is also shown (null above)' },
                { key: 'Visible 3', value: 'And this too (null above)' },
                null
            ]}
        />
    {/snippet}
</Story>

<Story
    name="Nested Table"
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const incrementButton = await canvas.getByRole('button', { name: /increment/i });
        expect(incrementButton).toBeDefined();
        const reactiveTerm = await canvas.getByRole('term', { name: /Reactive/i });
        const reactiveValue = reactiveTerm.nextElementSibling as HTMLElement;
        let initial = data;
        expect(reactiveValue?.textContent).toBe(initial.toString());
        incrementButton?.click();
        await tick();
        expect(reactiveValue?.textContent).toBe((initial + 1).toString());
    }}
>
    {#snippet template(args)}
        {#snippet innerTable()}
            <PropertyList
                size="xs"
                items={[
                    { key: 'Nested 1', value: 'Value A' },
                    { key: 'Nested 2', value: 'Value B' },
                    { key: 'Nested 3', value: 'Value C' }
                ]}
            />
        {/snippet}

        {#snippet incrementButton()}
            <Button onclick={() => data++} size="xs">Increment</Button>
        {/snippet}

        <PropertyList
            {...args}
            items={[
                { key: 'Simple', value: 'Top level value' },
                { key: 'Complex', value: innerTable },
                { key: 'Reactive', value: data.toString() },
                { key: 'Inc', value: incrementButton }
            ]}
        />
    {/snippet}
</Story>
