<script module lang="ts">
    import MockUserStore, { type MockLookup } from '#sb/MockUserStore.svelte';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import type { CurrentUserLike } from '#lib/account/userStore.svelte';
    import ChatPong from './ChatPong.svelte';

    type TemplateArgs = {
        from: string;
        roundTripMs: number;
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
        <ChatPong from={args.from} roundTripMs={args.roundTripMs} own={args.own} />
    </MockUserStore>
{/snippet}

<Story
    name="Peer pong"
    args={{
        from: 'usr_bob',
        roundTripMs: 128,
        own: false,
        result: users
    }}
/>

<Story
    name="Own pong"
    args={{
        from: 'usr_me',
        roundTripMs: 87,
        own: true,
        me: { id: 'usr_me', name: 'Me' },
        result: users
    }}
/>
