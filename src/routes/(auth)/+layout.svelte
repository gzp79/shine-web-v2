<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { page } from '$app/state';
    import LogoutGuard from '@lib/account/LogoutGuard.svelte';
    import { setCurrentUserContext } from '@lib/account/currentUserStore.svelte';
    import { getLocaleContext } from '@lib/i18n';
    import { logUser } from '@lib/loggers';
    import { getMenuContext } from '@lib/ui/app/AppMenu.svelte';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Settings from '@lib/ui/atoms/icons/common/Settings.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';
    import LoadingCard from '@lib/ui/components/cards/LoadingCard.svelte';
    import { createAppError } from '@lib/utils';

    let { children } = $props();

    const currentUser = setCurrentUserContext();
    const locale = getLocaleContext();
    const appMenu = getMenuContext();

    let isRedirecting = false;

    // Resolved `current` wins over `error`/`loading`, so a failed/in-flight
    // background refresh keeps the last known user instead of flickering.
    type AuthStatus = 'loading' | 'error' | 'unauthenticated' | 'authenticated';
    const status: AuthStatus = $derived.by(() => {
        const user = currentUser.current;
        if (user) return user.authenticated ? 'authenticated' : 'unauthenticated';
        if (currentUser.error) return 'error';
        return 'loading';
    });

    $effect(() => {
        if (status !== 'authenticated') return;

        logUser.log('Registering account menu items');
        return appMenu.register({
            id: 'account-info',
            section: 'user',
            label: locale.t('account.accountInfo'),
            icon: Settings,
            action: () => goto(resolve('/account'))
        });
    });

    // `isRedirecting` latches to fire the navigation once; it self-heals on
    // failure so a transient error can't trap the user on a spinner.
    // It also resets when status leaves 'unauthenticated' (e.g. user presses Back
    // and the component is reused) so the next unauthenticated state re-triggers.
    $effect(() => {
        if (status !== 'unauthenticated') {
            isRedirecting = false;
            return;
        }
        if (isRedirecting) return;

        isRedirecting = true;
        const returnUrl = page.url.pathname + page.url.search + page.url.hash;
        logUser.log(`User not authenticated, redirecting to login with returnUrl [${returnUrl}]`);
        goto(resolve(`/login?returnUrl=${encodeURIComponent(returnUrl)}`)).catch((err) => {
            logUser.error('Redirect to login failed, will retry', err);
            isRedirecting = false;
        });
    });
</script>

<LogoutGuard>
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

        {#if status === 'authenticated'}
            {@render children()}
        {:else if status === 'error'}
            <CenteredLayout>
                <ErrorCard error={createAppError(currentUser.error)}>
                    <Button onclick={() => currentUser.refresh()}>{locale.t('common.refresh')}</Button>
                </ErrorCard>
            </CenteredLayout>
        {:else}
            <CenteredLayout>
                <LoadingCard />
            </CenteredLayout>
        {/if}
    </svelte:boundary>
</LogoutGuard>
