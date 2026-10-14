<script module lang="ts">
    import { lorem } from '#sb/lorem';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { actionColorList, spacingList } from '#lib/ui/atoms';
    import Typography from '#lib/ui/atoms/Typography.svelte';
    import Dots from '#lib/ui/atoms/icons/animated/Dots.svelte';
    import Fatal from '#lib/ui/atoms/icons/common/Fatal.svelte';
    import Button from '#lib/ui/atoms/input/Button.svelte';
    import { layoutWidthList } from '#lib/ui/atoms/layouts';
    import Dialog, { type DialogProps } from '#lib/ui/atoms/layouts/Dialog.svelte';
    import Stack from '#lib/ui/atoms/layouts/Stack.svelte';
    import { cn } from '#lib/ui/utils';

    // `content` is a story-only arg (a lorem preset picker), so the args type comes from the
    // `render` snippet rather than from Dialog's props alone.
    type DialogArgs = DialogProps & {
        content?: string;
    };

    const { Story } = defineMeta({
        title: 'Atoms/Layouts/Dialog',
        component: Dialog,
        render: template,
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
            children: { control: false, table: { disable: true } },
            actions: { control: false, table: { disable: true } },
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
        }
    });

    // Module-scoped so the markup snippet referenced by `render` above stays declared after it;
    // a story file only ever has one instance, so sharing the state is harmless.
    let isOpen = $state(true);
</script>

{#snippet dialogContent(args: DialogArgs)}
    <Typography variant="text">
        {args.content}
    </Typography>
{/snippet}

{#snippet dialogActions()}
    <Button onclick={() => alert('Cancel clicked')}>Cancel</Button>
    <Button color="primary" onclick={() => alert('Confirm clicked')}>Confirm</Button>
{/snippet}

{#snippet template(args: DialogArgs)}
    {@const { children, content, ...otherArgs } = args}
    <Dialog {...otherArgs} contentClass="max-h-48">
        {@render dialogContent(args)}
    </Dialog>
{/snippet}

<Story name="Box like" />

<Story name="With title" args={{ title: 'Dialog Title' }} />

<Story name="With icon" args={{ closeIcon: true }} />

<Story name="With title and icon" args={{ title: 'Dialog Title', closeIcon: true }} />

<Story name="With actions" args={{ actions: dialogActions }} />

<Story name="With title and actions" args={{ title: 'Dialog Title', actions: dialogActions }} />

<Story name="With icon and actions" args={{ closeIcon: true, actions: dialogActions }} />

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
