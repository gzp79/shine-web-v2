<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import type { CurrentUserLike } from '@lib/account/userStore.svelte';
    import MockUserStore, { type MockLookup } from '../../../storybook/MockUserStore.svelte';
    import ChatPong from './ChatPong.svelte';
    import type { PongMessage } from './chatMessages';

    type TemplateArgs = {
        message: PongMessage;
        own: boolean;
        result?: MockLookup;
        me?: CurrentUserLike;
    };

    const users: MockLookup = {
        kind: 'resolved',
        users: { usr_jane: { name: 'Jane Doe' }, usr_bob: { name: 'Bob Fisher' } }
    };

    const { Story } = defineMeta({
        component: ChatPong,
        title: 'App/Chat/ChatPong',
        render: template
    });
</script>

{#snippet template(args: TemplateArgs)}
    <MockUserStore result={args.result} me={args.me}>
        <ChatPong message={args.message} own={args.own} />
    </MockUserStore>
{/snippet}

<Story
    name="Peer pong"
    args={{
        message: { kind: 'pong', id: '1-0', from: 'usr_bob', initiator: 'usr_jane', roundTripMs: 128 },
        own: false,
        result: users
    }}
/>

<Story
    name="Own pong"
    args={{
        message: { kind: 'pong', id: '2-0', from: 'usr_me', initiator: 'usr_jane', roundTripMs: 87 },
        own: true,
        me: { id: 'usr_me', name: 'Me' },
        result: users
    }}
/>
