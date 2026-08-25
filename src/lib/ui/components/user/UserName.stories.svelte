<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import type { CurrentUserLike } from '@lib/account/userStore.svelte';
    import MockUserStore, { type MockLookup } from '../../../../storybook/MockUserStore.svelte';
    import UserName from './UserName.svelte';

    type TemplateArgs = {
        id: string;
        placeholder?: string;
        selfLabel?: string;
        fallback?: string;
        result?: MockLookup;
        me?: CurrentUserLike;
    };

    const jane: MockLookup = { kind: 'resolved', users: { usr_jane: { name: 'Jane Doe' } } };

    const { Story } = defineMeta({
        component: UserName,
        title: 'Components/UserName',
        args: { id: 'usr_jane', result: jane },
        render: template
    });
</script>

{#snippet template(args: TemplateArgs)}
    <MockUserStore result={args.result} me={args.me}>
        <UserName id={args.id} placeholder={args.placeholder} selfLabel={args.selfLabel} fallback={args.fallback} />
    </MockUserStore>
{/snippet}

<Story name="Resolved name" />

<Story name="Loading" args={{ id: 'usr_jane', result: { kind: 'pending' } }} />

<Story name="Self" args={{ id: 'usr_me', selfLabel: 'You', me: { id: 'usr_me', name: 'Me' } }} />

<Story name="Not found" args={{ id: 'usr_ghost', result: { kind: 'resolved' } }} />

<Story name="Error → fallback" args={{ id: 'usr_jane', fallback: 'Unknown user', result: { kind: 'error' } }} />
