<script module lang="ts">
    import { lorem } from '@sb/lorem';
    import { withinPopover } from '@sb/models/popover';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect, waitFor } from 'storybook/test';
    import type { Component } from 'svelte';
    import { actionColorList, spacingList } from '@lib/ui/atoms';
    import Typography from '@lib/ui/atoms//Typography.svelte';
    import Dots from '@lib/ui/atoms/icons/animated/Dots.svelte';
    import Fatal from '@lib/ui/atoms/icons/common/Fatal.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import { layoutWidthList } from '@lib/ui/atoms/layouts';
    import Dialog, { type DialogProps } from '@lib/ui/atoms/layouts/Dialog.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import { cn } from '@lib/ui/utils';

    type ExtraProps = {
        content?: string;
    };

    const { Story } = defineMeta<unknown, Component<DialogProps & ExtraProps>>({
        title: 'Atoms/Layouts/Dialog',
        component: Dialog,
        args: {
            trigger: 'Open Dialog',
            open: true,
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
                options: ['default', ...layoutWidthList],
                mapping: {
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
        play: async () => {
            const canvas = withinPopover();
            await waitFor(async () => {
                const dialog = await canvas.getByRole('dialog');
                await expect(dialog).toBeVisible();
            });
        }
    });
</script>

<script lang="ts">
    let isOpen = $state(true);
</script>

{#snippet dialogContent(args: DialogProps & ExtraProps)}
    <Typography variant="text">
        {args.content}
    </Typography>
{/snippet}

<Story name="Box like">
    {#snippet template(args)}
        {@const { children, content, ...otherArgs } = args}
        <Dialog {...otherArgs} contentClass="max-h-48">
            {@render dialogContent(args)}
        </Dialog>
    {/snippet}
</Story>

<Story name="With title">
    {#snippet template(args)}
        {@const { children, ...otherArgs } = args}
        <Dialog {...otherArgs} title="Dialog Title" contentClass="max-h-48">
            {@render dialogContent(args)}
        </Dialog>
    {/snippet}
</Story>

<Story name="With icon">
    {#snippet template(args)}
        {@const { children, content, ...otherArgs } = args}
        <Dialog {...otherArgs} closeIcon={true} contentClass="max-h-48">
            {@render dialogContent(args)}
        </Dialog>
    {/snippet}
</Story>

<Story name="With title and icon">
    {#snippet template(args)}
        {@const { children, content, ...otherArgs } = args}
        <Dialog {...otherArgs} closeIcon={true} title="Dialog Title" contentClass="max-h-48">
            {@render dialogContent(args)}
        </Dialog>
    {/snippet}
</Story>

<Story name="With actions">
    {#snippet template(args)}
        {@const { children, content, ...otherArgs } = args}
        <Dialog {...otherArgs} contentClass="max-h-48">
            {@render dialogContent(args)}
            {#snippet actions()}
                <Button onclick={() => alert('Cancel clicked')}>Cancel</Button>
                <Button color="primary" onclick={() => alert('Confirm clicked')}>Confirm</Button>
            {/snippet}
        </Dialog>
    {/snippet}
</Story>

<Story name="With title and actions">
    {#snippet template(args)}
        {@const { children, content, ...otherArgs } = args}
        <Dialog {...otherArgs} contentClass="max-h-48">
            {@render dialogContent(args)}
            {#snippet actions()}
                <Button onclick={() => alert('Cancel clicked')}>Cancel</Button>
                <Button color="primary" onclick={() => alert('Confirm clicked')}>Confirm</Button>
            {/snippet}
        </Dialog>
    {/snippet}
</Story>

<Story name="With icon and actions">
    {#snippet template(args)}
        {@const { children, ...otherArgs } = args}
        <Dialog {...otherArgs} closeIcon={true} contentClass="max-h-48">
            {@render dialogContent(args)}
            {#snippet actions()}
                <Button onclick={() => alert('Cancel clicked')}>Cancel</Button>
                <Button color="primary" onclick={() => alert('Confirm clicked')}>Confirm</Button>
            {/snippet}
        </Dialog>
    {/snippet}
</Story>

<Story name="With fully customized">
    {#snippet template(args)}
        {@const { children, trigger, ...otherArgs } = args}
        <Dialog {...otherArgs} contentClass="max-h-48">
            {#snippet trigger({ class: cls })}
                <div class={cn(cls, 'rounded-sm')}>Open Dialog</div>
            {/snippet}
            {#snippet title({ class: cls })}
                <Typography element="h1" variant="h2" class={cls}>Custom Title Snippet <Dots /></Typography>
            {/snippet}
            {#snippet closeIcon({ class: cls })}
                <Fatal class={cn(cls, 'hover:backdrop-brightness-100 hover:fill-[red]')} />
            {/snippet}
            {@render dialogContent(args)}
            {#snippet actions()}
                <Button onclick={() => alert('Cancel clicked')}>Cancel</Button>
                <Button color="primary" onclick={() => alert('Confirm clicked')}>Confirm</Button>
            {/snippet}
        </Dialog>
    {/snippet}
</Story>

<Story name="Manual open/close" args={{ open: isOpen }}>
    {#snippet template(args)}
        {@const { children, ...otherArgs } = args}
        <Stack direction="column">
            <Button onclick={() => (isOpen = true)}>Open Dialog</Button>
            <Button onclick={() => (isOpen = true)}>Open 2</Button>
            <Button onclick={() => (isOpen = true)}>Open 3</Button>
        </Stack>

        <Dialog {...otherArgs} title="Alert Dialog" bind:open={isOpen} role="alertdialog">
            <Typography variant="text">This is an alert dialog. It requires user interaction to dismiss.</Typography>
            {#snippet actions()}
                <Button onclick={() => (isOpen = false)}>Close</Button>
            {/snippet}
        </Dialog>
    {/snippet}
</Story>
