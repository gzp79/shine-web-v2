<script module lang="ts">
    import MarginDecorator from '@sb/MarginDecorator.svelte';
    import mockQuery from '@sb/mock-remote.svelte';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect } from 'storybook/test';
    import { v4 as uuid } from 'uuid';
    import { async, createOtherError } from '@lib/utils';
    import LinkedIdentityCard from './LinkedIdentityCard.svelte';
    import { type LinkedIdentity } from './account.remote';

    const { Story } = defineMeta({
        component: LinkedIdentityCard,
        title: 'Account/LinkedIdentityCard',
        // Ignore https://github.com/storybookjs/storybook/issues/29951
        // @ts-expect-error Bug in Storybook
        decorators: [() => MarginDecorator],
        play: async ({ args, canvasElement }) => {
            await args.identities?.refresh();
            expect(canvasElement).toBeDefined();
        }
    });

    const userId = uuid();
    const sampleIdentities: LinkedIdentity[] = [
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
            providerUserId: 'johndoe',
            linkedAt: new Date('2024-02-10'),
            name: 'John Doe',
            email: 'john.doe@github.com'
        }
    ];
</script>

<Story
    name="Loading"
    args={{
        identities: mockQuery.loading(),
        unlink: () => async.never()
    }}
/>

<Story
    name="Error"
    args={{
        identities: mockQuery.error(createOtherError('Test error, failed to fetch linked identities')),
        unlink: () => async.never()
    }}
/>

<Story
    name="Simple"
    args={{
        identities: mockQuery.success(sampleIdentities),
        unlink: () => async.delay(2000)
    }}
/>

<Story
    name="Async and refreshed"
    args={{
        identities: mockQuery.async(async () => sampleIdentities, 2000),
        unlink: (_tokenHash: string) => async.delay(2000)
    }}
    play={async ({ args, canvasElement }) => {
        await args.identities.refresh();
        expect(canvasElement).toBeDefined();
    }}
/>

<Story
    name="Unlink - Never resolve"
    args={{
        identities: mockQuery.async(async () => sampleIdentities, 2000),
        unlink: () => async.never()
    }}
/>

<Story
    name="Unlink - Fail"
    args={{
        identities: mockQuery.async(async () => sampleIdentities, 2000),
        unlink: () => async.rejected(createOtherError('A test error occurred while unlinking the identity'))
    }}
/>
