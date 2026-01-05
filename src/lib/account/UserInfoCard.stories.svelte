<script module lang="ts">
    import mockQuery from '@sb/mock-remote.svelte';
    import { expectErrorState } from '@sb/pagemodels/error';
    import { expectLoadingState } from '@sb/pagemodels/loading';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect, within } from 'storybook/test';
    import { v4 as uuid } from 'uuid';
    import { createOtherError } from '@lib/utils';
    import UserInfoCard from './UserInfoCard.svelte';
    import type { CurrentUser } from './currentUser.svelte';

    const { Story } = defineMeta({
        component: UserInfoCard,
        title: 'Account/UserInfoCard',
        play: async ({ args, canvasElement }) => {
            await args.userInfo?.refresh();
            expect(canvasElement).toBeDefined();
        }
    });

    const sampleUserInfo: CurrentUser = {
        authenticated: true,
        id: uuid(),
        name: 'Freshman_123456',
        email: 'user@example.com'
    };
</script>

<Story
    name="Loading"
    args={{
        userInfo: mockQuery.loading()
    }}
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectLoadingState(canvas);
    }}
/>

<Story
    name="Error"
    args={{
        userInfo: mockQuery.error(createOtherError('Test error, failed to fetch user info'))
    }}
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expectErrorState(canvas, /Test error, failed to fetch user info/);
    }}
/>

<Story
    name="Current"
    args={{
        userInfo: mockQuery.success(sampleUserInfo)
    }}
/>

<Story
    name="Async and refreshed"
    args={{
        userInfo: mockQuery.async(async () => sampleUserInfo, 2000)
    }}
/>
