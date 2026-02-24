<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { setCurrentUserStore } from '@lib/account/currentUserStore.svelte';
    import { getLocaleContext } from '@lib/i18n';
    import { logUser } from '@lib/loggers';
    import { getMenuContext } from '@lib/ui/app/AppMenu.svelte';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Cross from '@lib/ui/atoms/icons/common/Cross.svelte';
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

        logUser.log('Registering logout menu item');
        const unregister = appMenu.register({
            id: 'logout',
            section: 'user',
            label: locale.t('account.logout'),
            icon: Cross,
            dangerous: true,
            action: () => {
                window.location.href = '/api/auth/logout';
            }
        });

        return unregister;
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
            <ErrorCard error={createAppError(error)} width="full">
                <Button
                    onclick={async () => {
                        await currentUser.refresh();
                        reset();
                    }}>{locale.t('common.refresh')}</Button
                >
            </ErrorCard>
        </CenteredLayout>
    {/snippet}

    {#snippet pending()}
        <CenteredLayout>
            <LoadingCard />
        </CenteredLayout>
    {/snippet}

    {#await currentUser then user}
        {#if user.authenticated}
            {@render children()}
        {:else}
            <CenteredLayout>
                <LoadingCard />
            </CenteredLayout>
        {/if}
    {/await}
</svelte:boundary>
