<script module lang="ts">
    import mockQuery from '@sb/mock-remote.svelte';
    import { clickDialogButton } from '@sb/models/dialog';
    import { expectErrorState, waitForErrorState, waitForErrorToBeRemoved } from '@sb/models/error';
    import { expectLoadingState, waitForLoadingToComplete } from '@sb/models/loading';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect, waitFor, within } from 'storybook/test';
    import { settled } from 'svelte';
    import { v4 as uuid } from 'uuid';
    import { async, createOtherError } from '@lib/utils';
    import LinkedIdentityCard from './LinkedIdentityCard.svelte';
    import { type LinkedIdentity } from './auth.remote';

    const { Story } = defineMeta({
        component: LinkedIdentityCard,
        title: 'Account/LinkedIdentityCard',
        play: async ({ args, canvasElement }) => {
            await args.identities?.refresh();
            expect(canvasElement).toBeDefined();
        }
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

<Story
    name="Loading"
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectLoadingState(canvas);
    }}
>
    {#snippet template(args)}
        <LinkedIdentityCard {...args} identities={mockQuery.loading()} unlink={() => async.never()} />
    {/snippet}
</Story>

<Story
    name="Error"
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectErrorState(canvas, /Test error, failed to fetch linked identities/);
    }}
>
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

<Story
    name="Unlink - Fail"
    play={async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);
        await waitForLoadingToComplete(canvas);

        await step('Unlink identity', async () => {
            const unlink = canvas.getAllByRole('button', { name: /unlink/i })[0];
            await unlink.click();
            await clickDialogButton(/unlink/i);
        });

        await step('Handle error', async () => {
            const error = await waitForErrorState(canvas, /A test error occurred while unlinking the identity/);
            const closeBtn = await within(error).getByRole('button', { name: /retry/i });
            await closeBtn.click();
            await waitForErrorToBeRemoved(canvas);
        });
    }}
>
    {#snippet template(args)}
        <LinkedIdentityCard
            {...args}
            identities={mockQuery.async(async () => sampleIdentities(), 100)}
            unlink={() => async.rejected(createOtherError('A test error occurred while unlinking the identity'))}
        />
    {/snippet}
</Story>
