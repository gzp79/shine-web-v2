<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import UserInfoCard from './UserInfoCard.svelte';

    const { Story } = defineMeta({
        component: UserInfoCard,
        title: 'Account/UserInfoCard'
    });
</script>

<Story name="Default">
    {#snippet template()}
        <UserInfoCard />
    {/snippet}
</Story>
