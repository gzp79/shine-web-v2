<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect } from 'storybook/test';
    import { v4 as uuid } from 'uuid';
    import { type IQuery, createOtherError } from '@lib/utils';
    import { ClientQuery } from '@lib/utils/client-query.svelte';
    import UserInfoCard from './UserInfoCard.svelte';
    import type { CurrentUser } from './currentUser.svelte';

    const { Story } = defineMeta({
        component: UserInfoCard,
        title: 'Account/UserInfoCard',
        play: async ({ canvasElement }) => {
            expect(canvasElement).toBeDefined();
        }
    });

    const sampleUserInfo: CurrentUser = {
        authenticated: true,
        id: uuid(),
        name: 'Freshman_123456',
        email: 'user@example.com'
    };

    // Default query state
    const defaultQuery: IQuery<CurrentUser> = {
        loading: false,
        error: undefined,
        current: undefined,
        refresh: async () => {}
    };

    const mockUserInfo = new ClientQuery<CurrentUser>(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));

        return {
            authenticated: true,
            id: uuid(),
            name: 'Freshman_123456',
            email: 'user@example.com'
        };
    });
</script>

<Story
    name="Loading"
    args={{
        userInfo: { ...defaultQuery, loading: true }
    }}
/>

<Story
    name="Error"
    args={{
        userInfo: { ...defaultQuery, error: createOtherError('Test error, failed to fetch user info') }
    }}
/>

<Story
    name="Current"
    args={{
        userInfo: { ...defaultQuery, current: sampleUserInfo }
    }}
/>

<Story
    name="Throw When Query"
    args={{
        userInfo: {
            ...defaultQuery,
            error: createOtherError('A test error occurred while querying user info')
        }
    }}
/>
