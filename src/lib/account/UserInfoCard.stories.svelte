<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import LogoutGuard from '@lib/account/LogoutGuard.svelte';
    import type { AuthenticatedCurrentUser } from '@lib/account/authContext.svelte';
    import App from '@lib/ui/app/App.svelte';
    import MockAuthContext from '../../storybook/MockAuthContext.svelte';
    import UserInfoCard from './UserInfoCard.svelte';

    const baseUser: AuthenticatedCurrentUser = {
        authenticated: true,
        id: 'usr_abc123',
        isLinked: true,
        name: 'Jane Doe',
        email: 'jane@example.com',
        isEmailVerified: true,
        createdAt: new Date('2024-01-15T10:30:00Z')
    };

    const { Story } = defineMeta({
        component: UserInfoCard,
        title: 'Account/UserInfoCard',
        args: { user: baseUser },
        render: template
    });
</script>

{#snippet template(args: { user: AuthenticatedCurrentUser })}
    <App>
        <MockAuthContext user={args.user}>
            <LogoutGuard>
                <UserInfoCard />
            </LogoutGuard>
        </MockAuthContext>
    </App>
{/snippet}

<Story name="Verified linked user" />

<Story
    name="Guest (not linked)"
    args={{ user: { ...baseUser, isLinked: false, name: 'Freshman', email: '', isEmailVerified: false } }}
/>

<Story name="Unverified email" args={{ user: { ...baseUser, isEmailVerified: false } }} />
