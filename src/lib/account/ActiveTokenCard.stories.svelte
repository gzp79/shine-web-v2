<script module lang="ts">
    import mockQuery from '@sb/mock-remote.svelte';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { v4 as uuid } from 'uuid';
    import { getLocaleContext } from '@lib/i18n';
    import { async, createOtherError } from '@lib/utils';
    import ActiveTokenCard from './ActiveTokenCard.svelte';
    import { type ActiveToken } from './auth.remote';

    const { Story } = defineMeta({
        component: ActiveTokenCard,
        title: 'Account/ActiveTokenCard'
    });

    const userId = uuid();

    const createToken = (overrides?: Partial<ActiveToken>): ActiveToken => ({
        userId,
        tokenHash: uuid(),
        kind: 'singleAccess',
        createdAt: new Date(Date.now()),
        expireAt: new Date(Date.now() + 3600 * 1000),
        isExpired: false,
        agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        country: null,
        region: null,
        city: null,
        ...overrides
    });

    const sampleTokens = (): ActiveToken[] => [
        createToken({
            kind: 'access',
            country: 'US',
            region: 'California',
            city: 'San Francisco'
        }),
        createToken({
            kind: 'persistent',
            createdAt: new Date('2021-08-01T12:00:00Z'),
            expireAt: new Date('2022-08-01T12:00:00Z'),
            isExpired: true
        })
    ];
</script>

<Story name="Loading">
    {#snippet template(args)}
        <ActiveTokenCard
            {...args}
            tokens={mockQuery.loading<ActiveToken[]>()}
            revoke={(_tokenHash: string) => async.never()}
        />
    {/snippet}
</Story>

<Story name="Error">
    {#snippet template(args)}
        <ActiveTokenCard
            {...args}
            tokens={mockQuery.error<ActiveToken[]>(createOtherError('Test error, failed to fetch linked tokens'))}
            revoke={(_tokenHash: string) => async.never()}
        />
    {/snippet}
</Story>

<Story name="Simple">
    {#snippet template(args)}
        <ActiveTokenCard
            {...args}
            tokens={mockQuery.success(sampleTokens())}
            revoke={(_tokenHash: string) => async.delay(2000)}
        />
    {/snippet}
</Story>

<Story name="Async and refreshed">
    {#snippet template(args)}
        <ActiveTokenCard
            {...args}
            tokens={mockQuery.async(async () => sampleTokens(), 2000)}
            revoke={(_tokenHash: string) => async.delay(2000)}
        />
    {/snippet}
</Story>

<Story name="Revoke - Never resolve">
    {#snippet template(args)}
        <ActiveTokenCard
            {...args}
            tokens={mockQuery.async(async () => sampleTokens(), 100)}
            revoke={(_tokenHash: string) => async.never()}
        />
    {/snippet}
</Story>

<Story name="Revoke - Fail">
    {#snippet template(args)}
        <ActiveTokenCard
            {...args}
            tokens={mockQuery.async(async () => sampleTokens(), 100)}
            revoke={(_tokenHash: string) =>
                async.rejected(createOtherError('A test error occurred while revoking the token'))}
        />
    {/snippet}
</Story>
