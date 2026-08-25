<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';
    import ChatMessageList, { type ChatListItem } from './ChatMessageList.svelte';

    const conversation: ChatListItem[] = [
        { id: '1-0', text: 'Welcome to the room 👋', own: false, author: 'user-8f3c1a2b' },
        { id: '2-0', text: 'Thanks! Testing the layout.', own: true, author: 'You' },
        { id: '3-0', text: 'Others align to the start.', own: false, author: 'user-8f3c1a2b' },
        { id: '4-0', text: 'And mine align to the end.', own: true, author: 'You' }
    ];

    const { Story } = defineMeta({
        component: ChatMessageList,
        title: 'Components/Chat/ChatMessageList',
        args: {
            messages: conversation
        }
    });
</script>

<Story name="Default">
    {#snippet template(args)}
        <Box width="fit" contentClass="h-96 w-96">
            <ChatMessageList {...args} />
        </Box>
    {/snippet}
</Story>

<Story name="Empty">
    {#snippet template()}
        <Box width="fit" contentClass="h-96 w-96">
            <ChatMessageList messages={[]}>
                {#snippet empty()}
                    <div class="flex h-full items-center justify-center">
                        <Typography variant="footnote" class="opacity-60">No messages yet.</Typography>
                    </div>
                {/snippet}
            </ChatMessageList>
        </Box>
    {/snippet}
</Story>
