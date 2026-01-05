<script module lang="ts">
    import MarginDecorator from '@sb/MarginDecorator.svelte';
    import mockQuery from '@sb/mock-remote.svelte';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect } from 'storybook/test';
    import { v4 as uuid } from 'uuid';
    import { createOtherError } from '@lib/utils';
    import UserInfoCard from './UserInfoCard.svelte';
    import type { CurrentUser } from './currentUser.svelte';

    const { Story } = defineMeta({
        component: UserInfoCard,
        title: 'Account/UserInfoCard',
        // Ignore https://github.com/storybookjs/storybook/issues/29951
        // @ts-expect-error Bug in Storybook
        decorators: [() => MarginDecorator],
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
/>

<Story
    name="Error"
    args={{
        userInfo: mockQuery.error(createOtherError('Test error, failed to fetch user info'))
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
