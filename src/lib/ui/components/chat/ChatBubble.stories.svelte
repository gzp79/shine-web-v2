<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import ChatBubble from './ChatBubble.svelte';

    const { Story } = defineMeta({
        component: ChatBubble,
        title: 'Components/Chat/ChatBubble',
        args: {
            text: 'Hello there!',
            own: false
        },
        argTypes: {
            own: { control: { type: 'boolean' } }
        }
    });
</script>

<Story name="Other" args={{ text: 'A message from someone else', own: false, author: 'user-8f3c1a2b' }} />

<Story name="Own" args={{ text: 'A message I sent', own: true, author: 'You' }} />

<Story name="Conversation">
    {#snippet template()}
        <Stack spacing={2} class="w-96">
            <ChatBubble text="Hey, are you seeing this?" own={false} author="user-8f3c1a2b" />
            <ChatBubble text="Yep, coming through loud and clear." own={true} author="You" />
            <ChatBubble text="Nice — the websocket reconnects on its own too." own={false} author="user-8f3c1a2b" />
            <ChatBubble
                text="Great. Long messages wrap and stay within the bubble width just fine."
                own={true}
                author="You"
            />
        </Stack>
    {/snippet}
</Story>
