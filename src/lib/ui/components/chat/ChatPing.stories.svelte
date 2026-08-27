<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import ChatPing from './ChatPing.svelte';

    const { Story } = defineMeta({
        component: ChatPing,
        title: 'Components/Chat/ChatPing'
    });
</script>

{#snippet user(id: string)}
    {id === 'me' ? 'You' : id}
{/snippet}

<Story name="Mine">
    {#snippet template()}
        <Stack spacing={2} class="w-96">
            <ChatPing message={{ kind: 'ping', id: '1-0', from: 'me', selfMs: 12 }} own={true} {user} />
        </Stack>
    {/snippet}
</Story>

<Story name="Other">
    {#snippet template()}
        <Stack spacing={2} class="w-96">
            <ChatPing message={{ kind: 'ping', id: '2-0', from: 'user-8f3c1a2b' }} own={false} {user} />
        </Stack>
    {/snippet}
</Story>
