<script module lang="ts">
    import mockQuery from '@sb/mock-remote.svelte';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { v4 as uuid } from 'uuid';
    import { async, createOtherError } from '@lib/utils';
    import LinkedIdentityCard from './LinkedIdentityCard.svelte';
    import { type LinkedIdentity } from './auth.remote';

    const { Story } = defineMeta({
        component: LinkedIdentityCard,
        title: 'Account/LinkedIdentityCard'
    });

    const userId = uuid();
    const sampleIdentities = (): LinkedIdentity[] => [
        {
            userId,
            provider: 'google',
            providerUserId: '123456789',
            linkedAt: new Date('2024-01-15'),
            name: 'John Doe',
            email: 'john@example.com'
        },
        {
            userId,
            provider: 'github',
            providerUserId: uuid(),
            linkedAt: new Date('2024-02-10'),
            name: 'John Doe',
            email: 'john.doe@github.com'
        }
    ];
</script>

<Story name="Loading">
    {#snippet template(args)}
        <LinkedIdentityCard {...args} identities={mockQuery.loading()} unlink={() => async.never()} />
    {/snippet}
</Story>

<Story name="Error">
    {#snippet template(args)}
        <LinkedIdentityCard
            {...args}
            identities={mockQuery.error(createOtherError('Test error, failed to fetch linked identities'))}
            unlink={() => async.never()}
        />
    {/snippet}
</Story>

<Story name="Simple">
    {#snippet template(args)}
        <LinkedIdentityCard
            {...args}
            identities={mockQuery.success(sampleIdentities())}
            unlink={() => async.delay(1000)}
        />
    {/snippet}
</Story>

<Story name="Async and refreshed">
    {#snippet template(args)}
        <LinkedIdentityCard
            {...args}
            identities={mockQuery.async(async () => sampleIdentities(), 1000)}
            unlink={(_tokenHash: string) => async.delay(1000)}
        />
    {/snippet}
</Story>

<Story name="Unlink - Never resolve">
    {#snippet template(args)}
        <LinkedIdentityCard
            {...args}
            identities={mockQuery.async(async () => sampleIdentities(), 1000)}
            unlink={() => async.never()}
        />
    {/snippet}
</Story>

<Story name="Unlink - Fail">
    {#snippet template(args)}
        <LinkedIdentityCard
            {...args}
            identities={mockQuery.async(async () => sampleIdentities(), 100)}
            unlink={() => async.rejected(createOtherError('A test error occurred while unlinking the identity'))}
        />
    {/snippet}
</Story>
