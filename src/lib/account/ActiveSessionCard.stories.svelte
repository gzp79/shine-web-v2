<script module lang="ts">
    import mockQuery from '@sb/mock-remote.svelte';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { v4 as uuid } from 'uuid';
    import { createOtherError, randomString } from '@lib/utils';
    import ActiveSessionCard from './ActiveSessionCard.svelte';
    import { type ActiveSession } from './auth.remote';

    const { Story } = defineMeta({
        component: ActiveSessionCard,
        title: 'Account/ActiveSessionCard'
    });

    const userId = uuid();
    const sampleSessions = (): ActiveSession[] => [
        {
            userId,
            tokenHash: uuid(),
            fingerprint: randomString(16),
            createdAt: new Date('2024-03-01T10:00:00Z'),
            agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
            country: 'US',
            region: 'California',
            city: 'San Francisco'
        },
        {
            userId,
            tokenHash: uuid(),
            fingerprint: randomString(16),
            createdAt: new Date('2024-03-05T15:30:00Z'),
            agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
            country: 'US',
            region: 'New York',
            city: 'New York'
        }
    ];
</script>

<Story name="Loading">
    {#snippet template(args)}
        <ActiveSessionCard {...args} sessions={mockQuery.loading()} />
    {/snippet}
</Story>

<Story name="Error">
    {#snippet template(args)}
        <ActiveSessionCard
            {...args}
            sessions={mockQuery.error(createOtherError('Test error, failed to fetch linked sessions'))}
        />
    {/snippet}
</Story>

<Story name="Simple">
    {#snippet template(args)}
        <ActiveSessionCard {...args} sessions={mockQuery.success(sampleSessions())} />
    {/snippet}
</Story>

<Story name="Async and refreshed">
    {#snippet template(args)}
        <ActiveSessionCard {...args} sessions={mockQuery.async(async () => sampleSessions(), 1000)} />
    {/snippet}
</Story>
