<script module lang="ts">
    import mockQuery from '@sb/mock-remote.svelte';
    import { expectErrorState } from '@sb/pagemodels/error';
    import { expectLoadingState } from '@sb/pagemodels/loading';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect, within } from 'storybook/test';
    import { v4 as uuid } from 'uuid';
    import { createOtherError, randomString } from '@lib/utils';
    import ActiveSessionCard from './ActiveSessionCard.svelte';
    import { type ActiveSession } from './account.remote';

    const { Story } = defineMeta({
        component: ActiveSessionCard,
        title: 'Account/ActiveSessionCard',
        play: async ({ args, canvasElement }) => {
            await args.sessions?.refresh();
            expect(canvasElement).toBeDefined();
        }
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

<Story
    name="Loading"
    args={{
        sessions: mockQuery.loading()
    }}
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectLoadingState(canvas);
    }}
/>

<Story
    name="Error"
    args={{
        sessions: mockQuery.error(createOtherError('Test error, failed to fetch linked sessions'))
    }}
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectErrorState(canvas, /Test error, failed to fetch linked sessions/);
    }}
/>

<Story
    name="Simple"
    args={{
        sessions: mockQuery.success(sampleSessions())
    }}
/>

<Story
    name="Async and refreshed"
    args={{
        sessions: mockQuery.async(async () => sampleSessions(), 2000)
    }}
/>
