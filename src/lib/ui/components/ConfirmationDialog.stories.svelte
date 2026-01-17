<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect, waitFor, within } from 'storybook/test';
    import { actionColorList } from '@lib/ui/atoms';
    import { layoutWidthList } from '@lib/ui/atoms/layouts';
    import ConfirmationDialog from './ConfirmationDialog.svelte';

    const { Story } = defineMeta({
        title: 'Components/ConfirmationDialog',
        component: ConfirmationDialog,
        args: {
            to: '#storybook-root',
            trigger: 'Open Dialog',
            title: 'Confirm Action',
            question: 'Are you sure you want to proceed?',
            confirm: 'Yes',
            open: true
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
            }
        },
        play: async ({ canvasElement, userEvent }) => {
            const portal = document.body.querySelector('#storybook-root') as HTMLElement;
            expect(portal).not.toBeNull();
            const canvas = within(portal);

            await waitFor(async () => {
                const dialog = await canvas.getByRole('dialog');
                await expect(dialog).toBeVisible();
            });
        }
    });
</script>

<script lang="ts">
</script>

<Story name="Default" />
<Story name="Mandatory" args={{ mandatory: true }} />

<!-- <Story name="With Action Callbacks">
    {#snippet template(args)}
        <ConfirmationDialog {...args}></ConfirmationDialog>
    {/snippet}
</Story>

<Story name="Disable Close">
    {#snippet template(args)}
        <ConfirmationDialog
            {...args}
            title="Important Confirmation"
            question="This dialog can be closed only by the actions."
            disableCloseOnEscape={true}
        >
            {#snippet trigger()}Open Dialog{/snippet}
        </ConfirmationDialog>
    {/snippet}
</Story>

<Story name="Manual Open/Close">
    {#snippet template(args)}
        {@const args_manual = { ...args, title: 'Manual Control Dialog' }}
        <Stack direction="column">
            <Button onclick={() => (storyOpenDialog = true)}>Open Dialog</Button>

            <ConfirmationDialog
                {...args_manual}
                question="This dialog is controlled manually via state binding."
                bind:open={storyOpenDialog}
            />
        </Stack>
    {/snippet}
</Story>

<Story name="Different Colors">
    {#snippet template(args)}
        <Stack direction="column">
            <ConfirmationDialog
                {...args}
                title="Danger Action"
                question="This action has consequences. Are you sure?"
                color="danger"
                confirmLabel="Proceed"
            >
                {#snippet trigger()}Danger Action{/snippet}
            </ConfirmationDialog>

            <ConfirmationDialog
                {...args}
                title="Success Confirmation"
                question="Everything looks good. Confirm to proceed?"
                color="success"
                confirmLabel="Continue"
            >
                {#snippet trigger()}Success Action{/snippet}
            </ConfirmationDialog>

            <ConfirmationDialog
                {...args}
                title="Warning"
                question="Please confirm this warning action."
                color="warning"
                confirmLabel="I Understand"
            >
                {#snippet trigger()}Warning{/snippet}
            </ConfirmationDialog>
        </Stack>
    {/snippet}
</Story>

<Story name="Different Sizes">
    {#snippet template(args)}
        <Stack direction="column">
            <ConfirmationDialog
                {...args}
                width="sm"
                title="Small Dialog"
                question="This is a small confirmation dialog."
            >
                {#snippet trigger()}Small{/snippet}
            </ConfirmationDialog>

            <ConfirmationDialog
                {...args}
                width="md"
                title="Medium Dialog"
                question="This is a medium confirmation dialog with more content."
            >
                {#snippet trigger()}Medium{/snippet}
            </ConfirmationDialog>

            <ConfirmationDialog
                {...args}
                width="lg"
                title="Large Dialog"
                question="This is a large confirmation dialog that takes up more space."
            >
                {#snippet trigger()}Large{/snippet}
            </ConfirmationDialog>
        </Stack>
    {/snippet}
</Story> -->
