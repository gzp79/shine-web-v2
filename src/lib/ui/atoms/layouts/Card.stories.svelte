<script module lang="ts">
    import { lorem } from '@sb/lorem';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect } from 'storybook/test';
    import type { Component } from 'svelte';
    import { actionColorList, spacingList } from '@lib/ui/atoms';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Firefox from '@lib/ui/atoms/glyphs/brands/Firefox.svelte';
    import Dots from '@lib/ui/atoms/icons/animated/Dots.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import { widthList } from '@lib/ui/atoms/layouts';
    import Card, { type CardProps } from '@lib/ui/atoms/layouts/Card.svelte';

    type ExtraProps = {
        content?: string;
    };

    const { Story } = defineMeta<unknown, Component<CardProps & ExtraProps>>({
        component: Card,
        title: 'Atoms/Layouts/Card',
        args: {
            content: 'medium'
        },
        argTypes: {
            color: {
                control: { type: 'select' },
                options: ['default', ...actionColorList],
                mapping: {
                    default: undefined
                }
            },
            width: {
                control: { type: 'select' },
                options: ['default', ...widthList],
                mapping: {
                    default: undefined
                }
            },
            margin: {
                control: { type: 'select' },
                options: ['default', ...spacingList.map((s) => ` ${s}`)],
                mapping: {
                    ...spacingList.reduce(
                        (acc, s) => {
                            acc[` ${s}`] = s;
                            return acc;
                        },
                        {} as Record<string, number>
                    ),
                    default: undefined
                }
            },
            padding: {
                control: { type: 'select' },
                options: ['default', ...spacingList.map((s) => ` ${s}`)],
                mapping: {
                    ...spacingList.reduce(
                        (acc, s) => {
                            acc[` ${s}`] = s;
                            return acc;
                        },
                        {} as Record<string, number>
                    ),
                    default: undefined
                }
            },
            content: {
                control: { type: 'select' },
                options: ['none', 'short', 'medium', 'long'],
                mapping: {
                    none: undefined,
                    short: lorem.short,
                    medium: lorem.medium,
                    long: lorem.long
                }
            }
        },
        play: async ({ canvasElement }) => {
            expect(canvasElement).toBeDefined();
        }
    });
</script>

{#snippet cardContent(args: CardProps & ExtraProps)}
    <Typography variant="text">
        {args.content}
    </Typography>
{/snippet}

<Story name="Box like">
    {#snippet template(args)}
        {@const { children, ...otherArgs } = args}
        <Card {...otherArgs} contentClass="max-h-48">
            {@render cardContent(args)}
        </Card>
    {/snippet}
</Story>

<Story name="With title">
    {#snippet template(args)}
        {@const { children, icon, title, ...otherArgs } = args}
        <Card {...otherArgs} contentClass="max-h-48">
            {#snippet title()}
                <Typography variant="h1">Card Title</Typography>
            {/snippet}
            {@render cardContent(args)}
        </Card>
    {/snippet}
</Story>

<Story name="With icon">
    {#snippet template(args)}
        {@const { children, icon, title, ...otherArgs } = args}
        <Card {...otherArgs} contentClass="max-h-48">
            {#snippet icon()}
                <Firefox size="md" />
            {/snippet}
            {@render cardContent(args)}
        </Card>
    {/snippet}
</Story>

<Story name="With title and icon">
    {#snippet template(args)}
        {@const { children, icon, title, ...otherArgs } = args}
        <Card {...otherArgs} contentClass="max-h-48">
            {#snippet icon()}
                <Firefox size="md" />
            {/snippet}
            {#snippet title()}
                <Typography element="h1" variant="h2">Card Title</Typography>
                <Dots />
            {/snippet}
            {@render cardContent(args)}
        </Card>
    {/snippet}
</Story>

<Story name="With actions">
    {#snippet template(args)}
        {@const { children, icon, title, ...otherArgs } = args}
        <Card {...otherArgs} contentClass="max-h-48">
            {@render cardContent(args)}
            {#snippet actions()}
                <Button onclick={() => alert('Cancel clicked')}>Cancel</Button>
                <Button color="primary" onclick={() => alert('Confirm clicked')}>Confirm</Button>
            {/snippet}
        </Card>
    {/snippet}
</Story>

<Story name="With title and actions">
    {#snippet template(args)}
        {@const { children, icon, title, ...otherArgs } = args}
        <Card {...otherArgs} contentClass="max-h-48">
            {#snippet title()}
                <Typography variant="h1">Card with Actions</Typography>
            {/snippet}
            {@render cardContent(args)}
            {#snippet actions()}
                <Button onclick={() => alert('Cancel clicked')}>Cancel</Button>
                <Button color="primary" onclick={() => alert('Confirm clicked')}>Confirm</Button>
            {/snippet}
        </Card>
    {/snippet}
</Story>

<Story name="With icon and actions">
    {#snippet template(args)}
        {@const { children, icon, title, ...otherArgs } = args}
        <Card {...otherArgs} contentClass="max-h-48">
            {#snippet icon()}
                <Firefox size="md" />
            {/snippet}
            {@render cardContent(args)}
            {#snippet actions()}
                <Button onclick={() => alert('Cancel clicked')}>Cancel</Button>
                <Button color="primary" onclick={() => alert('Confirm clicked')}>Confirm</Button>
            {/snippet}
        </Card>
    {/snippet}
</Story>

<Story name="With all features">
    {#snippet template(args)}
        {@const { children, icon, title, ...otherArgs } = args}
        <Card {...otherArgs} contentClass="max-h-48">
            {#snippet icon()}
                <Firefox size="md" />
            {/snippet}
            {#snippet title()}
                <Typography element="h1" variant="h2">Card Title</Typography>
                <Dots />
            {/snippet}
            {@render cardContent(args)}
            {#snippet actions()}
                <Button onclick={() => alert('Cancel clicked')}>Cancel</Button>
                <Button color="primary" onclick={() => alert('Confirm clicked')}>Confirm</Button>
            {/snippet}
        </Card>
    {/snippet}
</Story>
