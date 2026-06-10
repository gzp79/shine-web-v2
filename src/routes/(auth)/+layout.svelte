<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { setCurrentUserStore } from '@lib/account/currentUserStore.svelte';
    import { authPages } from '@lib/api/authPages';
    import { getLocaleContext } from '@lib/i18n';
    import { logUser } from '@lib/loggers';
    import { getMenuContext } from '@lib/ui/app/AppMenu.svelte';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Cross from '@lib/ui/atoms/icons/common/Cross.svelte';
    import Settings from '@lib/ui/atoms/icons/common/Settings.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';
    import LoadingCard from '@lib/ui/components/cards/LoadingCard.svelte';
    import { createAppError } from '@lib/utils';

    let { children } = $props();

    const currentUser = setCurrentUserStore();
    const locale = getLocaleContext();
    const appMenu = getMenuContext();

    $effect(() => {
        if (!currentUser.current || !currentUser.current.authenticated) {
            logUser.log('User not authenticated, skipping menu registration');
            return;
        }

        logUser.log('Registering account menu items');
        const unregisterAccount = appMenu.register({
            id: 'account-info',
            section: 'user',
            label: locale.t('account.accountInfo'),
            icon: Settings,
            action: () => goto(resolve('/account'))
        });
        const unregister = appMenu.register({
            id: 'logout',
            section: 'user',
            label: locale.t('account.logout'),
            icon: Cross,
            dangerous: true,
            action: () => {
                window.location.href = authPages.logoutUrl({ terminateAll: false, redirectUrl: '/public/bye' });
            }
        });

        return () => {
            unregisterAccount();
            unregister();
        };
    });

    $effect(() => {
        if (currentUser.loading) {
            logUser.log('Current user is loading, waiting...');
            return;
        }

        if (!currentUser.error && currentUser.current && !currentUser.current.authenticated) {
            logUser.log('User not authenticated, redirecting to login page', currentUser.current);
            goto(resolve('/login'));
        }
    });
</script>

<svelte:boundary>
    {#snippet failed(error, reset)}
        <CenteredLayout>
            <ErrorCard error={createAppError(error)}>
                <Button
                    onclick={async () => {
                        await currentUser.refresh();
                        reset();
                    }}>{locale.t('common.refresh')}</Button
                >
            </ErrorCard>
        </CenteredLayout>
    {/snippet}

    {#if currentUser.loading}
        <CenteredLayout>
            <LoadingCard />
        </CenteredLayout>
    {:else if currentUser.error}
        <CenteredLayout>
            <ErrorCard error={createAppError(currentUser.error)}>
                <Button onclick={() => currentUser.refresh()}>{locale.t('common.refresh')}</Button>
            </ErrorCard>
        </CenteredLayout>
    {:else if currentUser.current?.authenticated}
        {@render children()}
    {:else}
        <CenteredLayout>
            <LoadingCard />
        </CenteredLayout>
    {/if}
</svelte:boundary>
