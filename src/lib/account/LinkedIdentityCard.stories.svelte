<script module lang="ts">
    import mockQuery from '@sb/mock-remote.svelte';
    import { expectErrorState, waitForErrorState, waitForErrorToBeRemoved } from '@sb/pagemodels/error';
    import { expectLoadingState, waitForLoadingToComplete } from '@sb/pagemodels/loading';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect, within } from 'storybook/test';
    import { settled } from 'svelte';
    import { v4 as uuid } from 'uuid';
    import { async, createOtherError } from '@lib/utils';
    import LinkedIdentityCard from './LinkedIdentityCard.svelte';
    import { type LinkedIdentity } from './account.remote';

    const { Story } = defineMeta({
        component: LinkedIdentityCard,
        title: 'Account/LinkedIdentityCard',
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
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectLoadingState(canvas);
    }}
/>

<Story
    name="Error"
    args={{
        identities: mockQuery.error(createOtherError('Test error, failed to fetch linked identities')),
        unlink: () => async.never()
    }}
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectErrorState(canvas, /Test error, failed to fetch linked identities/);
    }}
/>

<Story
    name="Simple"
    args={{
        identities: mockQuery.success(sampleIdentities),
        unlink: () => async.delay(1000)
    }}
/>

<Story
    name="Async and refreshed"
    args={{
        identities: mockQuery.async(async () => sampleIdentities, 1000),
        unlink: (_tokenHash: string) => async.delay(1000)
    }}
/>

<Story
    name="Unlink - Never resolve"
    args={{
        identities: mockQuery.async(async () => sampleIdentities, 1000),
        unlink: () => async.never()
    }}
/>

<Story
    name="Unlink - Fail"
    args={{
        identities: mockQuery.async(async () => sampleIdentities, 100),
        unlink: () => async.rejected(createOtherError('A test error occurred while unlinking the identity'))
    }}
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await waitForLoadingToComplete(canvas);

        const unlink = canvas.getAllByRole('button', { name: /unlink/i })[0];
        await unlink.click();
        const error = await waitForErrorState(canvas, /A test error occurred while unlinking the identity/);
        const closeBtn = await within(error).getByRole('button', { name: /retry/i });
        await closeBtn.click();
        await waitForErrorToBeRemoved(canvas);
    }}
/>
