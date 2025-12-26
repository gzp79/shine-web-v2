<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect } from 'storybook/test';
    import { v4 as uuid } from 'uuid';
    import { type IQuery, createOtherError } from '@lib/utils';
    import { ClientQuery } from '@lib/utils/client-query.svelte';
    import LinkedIdentityCard from './LinkedIdentityCard.svelte';
    import { type LinkedIdentity } from './account.remote';

    const { Story } = defineMeta({
        component: LinkedIdentityCard,
        title: 'Account/LinkedIdentityCard',
        play: async ({ canvasElement }) => {
            expect(canvasElement).toBeDefined();
        }
    });

    const sampleIdentities: LinkedIdentity[] = [
        {
            provider: 'google',
            providerUserId: '123456789',
            linkedAt: new Date('2024-01-15'),
            name: 'John Doe',
            email: 'john@example.com'
        },
        {
            provider: 'github',
            providerUserId: 'johndoe',
            linkedAt: new Date('2024-02-10'),
            name: 'John Doe',
            email: 'john.doe@github.com'
        }
    ];

    const defaultQuery: IQuery<LinkedIdentity[]> = {
        loading: false,
        error: undefined,
        current: undefined,
        refresh: async () => {}
    };

    const mockIdentities = new ClientQuery<LinkedIdentity[]>(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));

        return [
            {
                provider: 'google',
                providerUserId: uuid(),
                linkedAt: new Date('2024-01-15'),
                name: 'John Doe',
                email: 'john@example.com'
            },
            {
                provider: 'github',
                providerUserId: uuid(),
                linkedAt: new Date('2024-02-10'),
                name: 'John Doe',
                email: 'john.doe@github.com'
            }
        ];
    });
</script>

<Story
    name="Loading"
    args={{
        identities: { ...defaultQuery, loading: true }
    }}
/>

<Story
    name="Error"
    args={{
        identities: { ...defaultQuery, error: createOtherError('Test error, failed to fetch linked identities') }
    }}
/>

<Story
    name="Current"
    args={{
        identities: { ...defaultQuery, current: sampleIdentities }
    }}
/>

<Story
    name="Throw When Query"
    args={{
        identities: {
            ...defaultQuery,
            error: createOtherError('A test error occurred while querying linked identities')
        }
    }}
/>
