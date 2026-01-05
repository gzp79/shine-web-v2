<script module lang="ts">
    import mockQuery from '@sb/mock-remote.svelte';
    import { expectErrorState, waitForErrorState, waitForErrorToBeRemoved } from '@sb/pagemodels/error';
    import { expectLoadingState, waitForLoadingToComplete } from '@sb/pagemodels/loading';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect, waitFor, within } from 'storybook/test';
    import { v4 as uuid } from 'uuid';
    import { async, createOtherError } from '@lib/utils';
    import ActiveTokenCard from './ActiveTokenCard.svelte';
    import { type ActiveToken } from './account.remote';

    const { Story } = defineMeta({
        component: ActiveTokenCard,
        title: 'Account/ActiveTokenCard',
        play: async ({ args, canvasElement }) => {
            await args.tokens?.refresh();
            expect(canvasElement).toBeDefined();
        }
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

    const sampleTokens: ActiveToken[] = [
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

<Story
    name="Loading"
    args={{
        tokens: mockQuery.loading<ActiveToken[]>(),
        revoke: (_tokenHash: string) => async.never()
    }}
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectLoadingState(canvas);
    }}
/>

<Story
    name="Error"
    args={{
        tokens: mockQuery.error<ActiveToken[]>(createOtherError('Test error, failed to fetch linked tokens')),
        revoke: (_tokenHash: string) => async.never()
    }}
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectErrorState(canvas, /Test error, failed to fetch linked tokens/);
    }}
/>

<Story
    name="Simple"
    args={{
        tokens: mockQuery.success(sampleTokens),
        revoke: (_tokenHash: string) => async.delay(2000)
    }}
/>

<Story
    name="Async and refreshed"
    args={{
        tokens: mockQuery.async(async () => sampleTokens, 2000),
        revoke: (_tokenHash: string) => async.delay(2000)
    }}
/>

<Story
    name="Revoke - Never resolve"
    args={{
        tokens: mockQuery.async(async () => sampleTokens, 100),
        revoke: (_tokenHash: string) => async.never()
    }}
/>

<Story
    name="Revoke - Fail"
    args={{
        tokens: mockQuery.async(async () => sampleTokens, 100),
        revoke: (_tokenHash: string) =>
            async.rejected(createOtherError('A test error occurred while revoking the token'))
    }}
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await waitForLoadingToComplete(canvas);

        const unlink = canvas.getAllByRole('button', { name: /revoke/i })[0];
        await unlink.click();
        const error = await waitForErrorState(canvas, /A test error occurred while revoking the token/);
        const closeBtn = await within(error).getByRole('button', { name: /retry/i });
        await closeBtn.click();
        await waitForErrorToBeRemoved(canvas);

        {
            const unlink = canvas.getAllByRole('button', { name: /revoke/i })[0];
            expect(unlink).toBeDisabled();
            waitFor(async () => {
                expect(unlink).not.toBeDisabled();
            });
        }
    }}
/>
