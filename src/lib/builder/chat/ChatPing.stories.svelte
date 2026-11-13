<script module lang="ts">
    import MockUserStore, { type MockLookup } from '#sb/MockUserStore.svelte';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import type { CurrentUserLike } from '#lib/account/userStore.svelte';
    import ChatPing from './ChatPing.svelte';

    type TemplateArgs = {
        from: string;
        selfMs?: number;
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
        <ChatPing from={args.from} selfMs={args.selfMs} own={args.own} />
    </MockUserStore>
{/snippet}

<Story name="Peer ping" args={{ from: 'usr_jane', own: false, result: users }} />

<Story
    name="Own ping"
    args={{
        from: 'usr_me',
        selfMs: 42,
        own: true,
        me: { id: 'usr_me', name: 'Me' }
    }}
/>
