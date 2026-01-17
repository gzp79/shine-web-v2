<script module lang="ts">
    import { withinPopover } from '@sb/models/popover';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect, waitFor, within } from 'storybook/test';
    import { actionColorList } from '@lib/ui/atoms';
    import { layoutWidthList } from '@lib/ui/atoms/layouts';
    import ConfirmationDialog from './ConfirmationDialog.svelte';

    const { Story } = defineMeta({
        title: 'Components/ConfirmationDialog',
        component: ConfirmationDialog,
        args: {
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
</script>

<Story name="Default" />
<Story name="Mandatory" args={{ preventClose: true }} />

<Story name="Custom Actions">
    {#snippet template(args)}
        <ConfirmationDialog
            {...args}
            onConfirm={() => console.log('Confirmed')}
            onCancel={() => console.log('Cancelled')}
        >
            {#snippet confirm({ class: cls, onclick, ref })}
                <button class={cls} {onclick} bind:this={ref.get, ref.set}> Yes, continue </button>
            {/snippet}
            {#snippet cancel({ class: cls, onclick })}
                <button class={cls} {onclick}>No, go back</button>
            {/snippet}
        </ConfirmationDialog>
    {/snippet}
</Story>
