<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';
    import ChatBubble from './ChatBubble.svelte';
    import ChatGap from './ChatGap.svelte';
    import ChatMessageList from './ChatMessageList.svelte';

    type SampleMessage = { id: string; kind: 'text' | 'gap'; from?: string; text?: string };

    const SELF = 'me';

    const conversation: SampleMessage[] = [
        { kind: 'text', id: '1-0', from: 'user-8f3c1a2b', text: 'Welcome to the room 👋' },
        { kind: 'text', id: '2-0', from: SELF, text: 'Thanks! Testing the layout.' },
        { kind: 'gap', id: '3-0' },
        { kind: 'text', id: '5-0', from: 'user-8f3c1a2b', text: 'Back again.' }
    ];

    const { Story } = defineMeta({
        component: ChatMessageList,
        title: 'Components/Chat/ChatMessageList'
    });
</script>

{#snippet item(message: SampleMessage)}
    {#if message.kind === 'gap'}
        <ChatGap />
    {:else if message.kind === 'text'}
        <ChatBubble
            content={message.text ?? ''}
            align={message.from === SELF ? 'end' : 'start'}
            author={message.from ?? ''}
        />
    {/if}
{/snippet}

<Story name="Default">
    {#snippet template()}
        <Box width="fit" contentClass="h-96 w-96">
            <ChatMessageList messages={conversation} {item} />
        </Box>
    {/snippet}
</Story>

<Story name="Empty">
    {#snippet template()}
        <Box width="fit" contentClass="h-96 w-96">
            <ChatMessageList messages={[]} {item} />
        </Box>
    {/snippet}
</Story>
