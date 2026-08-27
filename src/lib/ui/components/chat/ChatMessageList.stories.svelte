<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';
    import ChatMessageList from './ChatMessageList.svelte';
    import type { ChatMessage } from './chatMessages';

    const SELF = 'me';

    const conversation: ChatMessage[] = [
        { kind: 'text', id: '1-0', from: 'user-8f3c1a2b', text: 'Welcome to the room 👋' },
        { kind: 'text', id: '2-0', from: SELF, text: 'Thanks! Testing the layout.' },
        { kind: 'gap', id: '3-0' },
        { kind: 'ping', id: '5-0', from: SELF, selfMs: 12 },
        { kind: 'ping', id: '6-0', from: 'user-8f3c1a2b' },
        { kind: 'pong', id: '7-0', from: 'user-8f3c1a2b', roundTripMs: 34 }
    ];

    const { Story } = defineMeta({
        component: ChatMessageList,
        title: 'Components/Chat/ChatMessageList',
        args: {
            messages: conversation,
            selfId: SELF
        }
    });
</script>

{#snippet user(id: string)}
    {id === SELF ? 'You' : id}
{/snippet}

<Story name="Default">
    {#snippet template(args)}
        <Box width="fit" contentClass="h-96 w-96">
            <ChatMessageList {...args} {user} />
        </Box>
    {/snippet}
</Story>

<Story name="Empty">
    {#snippet template()}
        <Box width="fit" contentClass="h-96 w-96">
            <ChatMessageList messages={[]} selfId={SELF} {user} />
        </Box>
    {/snippet}
</Story>
