<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import type { CurrentUserLike } from '@lib/account/userStore.svelte';
    import MockUserStore, { type MockLookup } from '../../../storybook/MockUserStore.svelte';
    import ChatPing from './ChatPing.svelte';
    import type { PingMessage } from './chatMessages';

    type TemplateArgs = {
        message: PingMessage;
        own: boolean;
        result?: MockLookup;
        me?: CurrentUserLike;
    };

    const users: MockLookup = { kind: 'resolved', users: { usr_jane: { name: 'Jane Doe' } } };

    const { Story } = defineMeta({
        component: ChatPing,
        title: 'App/Chat/ChatPing',
        render: template
    });
</script>

{#snippet template(args: TemplateArgs)}
    <MockUserStore result={args.result} me={args.me}>
        <ChatPing message={args.message} own={args.own} />
    </MockUserStore>
{/snippet}

<Story name="Peer ping" args={{ message: { kind: 'ping', id: '1-0', from: 'usr_jane' }, own: false, result: users }} />

<Story
    name="Own ping"
    args={{
        message: { kind: 'ping', id: '2-0', from: 'usr_me', selfMs: 42 },
        own: true,
        me: { id: 'usr_me', name: 'Me' }
    }}
/>
