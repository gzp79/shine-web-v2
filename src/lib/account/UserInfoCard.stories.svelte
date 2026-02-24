<script module lang="ts">
    import mockQuery from '@sb/mock-remote.svelte';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { v4 as uuid } from 'uuid';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import { createOtherError } from '@lib/utils';
    import UserInfoCard from './UserInfoCard.svelte';
    import type { CurrentUser } from './currentUserStore.svelte';

    const { Story } = defineMeta({
        component: UserInfoCard,
        title: 'Account/UserInfoCard'
    });

    const sampleUserInfo: CurrentUser = {
        authenticated: true,
        id: uuid(),
        isLinked: false,
        name: 'Freshman_123456',
        email: 'user@example.com',
        isEmailVerified: true,
        createdAt: new Date('2022-01-15T10:20:30Z')
    };
</script>

<script lang="ts">
    let count = $state(0);
</script>

<Story name="Loading">
    {#snippet template(args)}
        <UserInfoCard {...args} userInfo={mockQuery.loading()} />
    {/snippet}
</Story>

<Story name="Error">
    {#snippet template(args)}
        <UserInfoCard {...args} userInfo={mockQuery.error(createOtherError('Test error, failed to fetch user info'))} />
    {/snippet}
</Story>

<Story name="Current">
    {#snippet template(args)}
        <UserInfoCard {...args} userInfo={mockQuery.success(sampleUserInfo)} />
    {/snippet}
</Story>

<Story name="Async and refreshed">
    {#snippet template(args)}
        <UserInfoCard {...args} userInfo={mockQuery.async(async () => sampleUserInfo, 2000)} />
    {/snippet}
</Story>
