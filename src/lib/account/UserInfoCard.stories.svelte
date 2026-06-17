<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { setCurrentUserContext } from '@lib/account/currentUserStore.svelte';
    import LogoutGuard from '@lib/account/LogoutGuard.svelte';
    import { getLocaleContext } from '@lib/i18n';
    import { getThemeContext } from '@lib/theme/_theme.svelte';
    import App from '@lib/ui/app/App.svelte';
    import UserInfoCard from './UserInfoCard.svelte';

    const { Story } = defineMeta({
        component: UserInfoCard,
        title: 'Account/UserInfoCard'
    });
</script>

<script lang="ts">
    const theme = getThemeContext();
    const locale = getLocaleContext();

    setCurrentUserContext();
</script>

<Story name="Default">
    {#snippet template()}
        <App theme={theme.current} locale={locale.current}>
            <LogoutGuard>
                <UserInfoCard />
            </LogoutGuard>
        </App>
    {/snippet}
</Story>
