<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { page } from '$app/state';
    import type { Snippet } from 'svelte';
    import { type AuthenticatedCurrentUser, setAuthenticatedUserContext } from '@lib/account/authContext.svelte';
    import { createCurrentUserStore } from '@lib/account/currentUserStore.svelte';
    import { getLocaleContext } from '@lib/i18n';
    import { logUser } from '@lib/loggers';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';
    import LoadingCard from '@lib/ui/components/cards/LoadingCard.svelte';
    import { createAppError } from '@lib/utils';

    let { children }: { children?: Snippet } = $props();

    const currentUser = createCurrentUserStore();
    const locale = getLocaleContext();

    let isRedirecting = false;

    type AuthStatus = 'loading' | 'error' | 'unauthenticated' | 'authenticated';
    const status: AuthStatus = $derived.by(() => {
        const user = currentUser.current;
        if (user) return user.authenticated ? 'authenticated' : 'unauthenticated';
        if (currentUser.error) return 'error';
        return 'loading';
    });

    setAuthenticatedUserContext({
        get user(): AuthenticatedCurrentUser {
            const user = currentUser.current;
            if (!user?.authenticated) {
                throw new Error('AuthenticatedUserContext read while not authenticated');
            }
            return user;
        },
        refresh: () => currentUser.refresh()
    });

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

{#if status === 'authenticated'}
    {@render children?.()}
{:else if status === 'error'}
    <CenteredLayout>
        <ErrorCard error={createAppError(currentUser.error)}>
            <Button disabled={currentUser.loading} onclick={() => currentUser.refresh()}>
                {locale.t('common.refresh')}
            </Button>
        </ErrorCard>
    </CenteredLayout>
{:else}
    <CenteredLayout>
        <LoadingCard />
    </CenteredLayout>
{/if}
