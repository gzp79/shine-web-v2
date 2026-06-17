<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import LogoutGuard from '@lib/account/LogoutGuard.svelte';
    import type { AuthenticatedCurrentUser } from '@lib/account/currentUserStore.svelte';
    import { getLocaleContext } from '@lib/i18n';
    import { getThemeContext } from '@lib/theme/_theme.svelte';
    import App from '@lib/ui/app/App.svelte';
    import MockAuthContext from '../../storybook/MockAuthContext.svelte';
    import UserInfoCard from './UserInfoCard.svelte';

    const { Story } = defineMeta({
        component: UserInfoCard,
        title: 'Account/UserInfoCard'
    });

    const baseUser: AuthenticatedCurrentUser = {
        authenticated: true,
        id: 'usr_abc123',
        isLinked: true,
        name: 'Jane Doe',
        email: 'jane@example.com',
        isEmailVerified: true,
        createdAt: new Date('2024-01-15T10:30:00Z')
    };
</script>

<script lang="ts">
    const theme = getThemeContext();
    const locale = getLocaleContext();
</script>

{#snippet card(user: AuthenticatedCurrentUser)}
    <App theme={theme.current} locale={locale.current}>
        <MockAuthContext {user}>
            <LogoutGuard>
                <UserInfoCard />
            </LogoutGuard>
        </MockAuthContext>
    </App>
{/snippet}

<Story name="Verified linked user">
    {#snippet template()}
        {@render card(baseUser)}
    {/snippet}
</Story>

<Story name="Guest (not linked)">
    {#snippet template()}
        {@render card({ ...baseUser, isLinked: false, name: 'Freshman', email: '', isEmailVerified: false })}
    {/snippet}
</Story>

<Story name="Unverified email">
    {#snippet template()}
        {@render card({ ...baseUser, isEmailVerified: false })}
    {/snippet}
</Story>
