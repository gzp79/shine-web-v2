<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { actionColorList } from '@lib/ui/atoms';
    import { layoutWidthList } from '@lib/ui/atoms/layouts';
    import ConfirmationDialog from './ConfirmationDialog.svelte';

    const { Story } = defineMeta({
        title: 'Components/Dialogs/ConfirmationDialog',
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
            confirmAction={{ onclick: () => console.log('Confirmed') }}
            cancelAction={{ onclick: () => console.log('Cancelled') }}
        >
            {#snippet confirm({ class: cls, action })}
                <button class={cls} {...action}> Yes, continue </button>
            {/snippet}
            {#snippet cancel({ class: cls, action })}
                <button class={cls} {...action}>No, go back</button>
            {/snippet}
        </ConfirmationDialog>
    {/snippet}
</Story>
