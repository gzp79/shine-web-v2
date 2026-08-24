<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { actionColorList, sizeList } from '@lib/ui/atoms';
    import ChatInput from './ChatInput.svelte';

    const { Story } = defineMeta({
        component: ChatInput,
        title: 'Components/Chat/ChatInput',
        args: {
            onSubmit: (text: string) => console.log('submit:', text),
            placeholder: 'Type a message…',
            disabled: false
        },
        argTypes: {
            color: {
                control: { type: 'select' },
                options: ['default', ...actionColorList],
                mapping: { default: undefined }
            },
            size: {
                control: { type: 'select' },
                options: ['default', ...sizeList],
                mapping: { default: undefined }
            },
            disabled: { control: { type: 'boolean' } }
        }
    });
</script>

<Story name="Default">
    {#snippet template(args)}
        <div class="w-96">
            <ChatInput {...args} />
        </div>
    {/snippet}
</Story>

<Story name="Disabled" args={{ disabled: true }}>
    {#snippet template(args)}
        <div class="w-96">
            <ChatInput {...args} />
        </div>
    {/snippet}
</Story>
