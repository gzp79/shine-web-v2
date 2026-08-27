<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import ChatPong from './ChatPong.svelte';

    const { Story } = defineMeta({
        component: ChatPong,
        title: 'Components/Chat/ChatPong'
    });
</script>

{#snippet user(id: string)}
    {id === 'me' ? 'You' : id}
{/snippet}

<Story name="Mine">
    {#snippet template()}
        <Stack spacing={2} class="w-96">
            <ChatPong message={{ kind: 'pong', id: '1-0', from: 'me', roundTripMs: 8 }} own={true} {user} />
        </Stack>
    {/snippet}
</Story>

<Story name="Other">
    {#snippet template()}
        <Stack spacing={2} class="w-96">
            <ChatPong
                message={{ kind: 'pong', id: '2-0', from: 'user-8f3c1a2b', roundTripMs: 34 }}
                own={false}
                {user}
            />
        </Stack>
    {/snippet}
</Story>
