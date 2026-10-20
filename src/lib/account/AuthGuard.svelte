<script lang="ts">
    import { navigating } from '$app/state';
    import type { Snippet } from 'svelte';
    import { type AuthenticatedCurrentUser, setAuthenticatedUserContext } from '#lib/account/authContext.svelte';
    import { createCurrentUserStore } from '#lib/account/currentUserStore.svelte';
    import { provideUserStoreContext } from '#lib/account/userStore.svelte';
    import { getLocaleContext } from '#lib/i18n';
    import { logUser } from '#lib/loggers';
    import CenteredLayout from '#lib/ui/app/CenteredLayout.svelte';
    import Button from '#lib/ui/atoms/input/Button.svelte';
    import ErrorCard from '#lib/ui/components/cards/ErrorCard.svelte';
    import LoadingCard from '#lib/ui/components/cards/LoadingCard.svelte';
    import { currentLocationUrl, loginPageUrl } from '#lib/utils';

    type AuthStatus = 'loading' | 'error' | 'unauthenticated' | 'authenticated';

    let { children }: { children?: Snippet } = $props();

    const currentUser = createCurrentUserStore();
    const locale = getLocaleContext();
    const userId = $derived(currentUser.current?.authenticated ? currentUser.current.id : undefined);
    const status: AuthStatus = $derived.by(() => {
        // Note that `error` alone never revokes access: a refresh that fails with anything other than
        // 401 leaves the last known user in `current`, and the app keeps rendering as authenticated
        // while the store retries in the background.
        const user = currentUser.current;
        if (user) return user.authenticated ? 'authenticated' : 'unauthenticated';
        if (currentUser.error) return 'error';
        return 'loading';
    });

    // The last authenticated user, tracked while the session is live. Being set at all also means a
    // session existed once, which is how the redirect below tells an expired session from a visitor
    // who never had one.
    let lastAuthenticated: AuthenticatedCurrentUser | undefined;

    $effect(() => {
        const user = currentUser.current;
        if (user?.authenticated) lastAuthenticated = user;
    });

    // Sends an unauthenticated visitor to the login page.
    $effect(() => {
        if (status !== 'unauthenticated') return;
        // A client navigation is in flight, wait for it: `navigating.to` is reactive and always clears.
        if (navigating.to) return;

        const target = loginPageUrl({
            returnUrl: currentLocationUrl(),
            hint: lastAuthenticated ? 'login-expired' : undefined
        });
        logUser.log(`User not authenticated, redirecting to [${target}]`);
        // Use a document navigation rather than `goto` as it forces a full document navigation.
        window.location.replace(target);
    });

    setAuthenticatedUserContext({
        get user(): AuthenticatedCurrentUser {
            const user = currentUser.current;
            if (user?.authenticated) return user;
            if (lastAuthenticated) return lastAuthenticated;
            throw new Error('AuthenticatedUserContext read while not authenticated');
        },
        get loading(): boolean {
            return currentUser.loading;
        },
        refresh: () => currentUser.refresh(),
        revalidateSession: async () => {
            try {
                await currentUser.refresh();
            } catch {
                // Swallowed: a transport failure is not an evidence that the session died.
            }
            return currentUser.current?.authenticated === true;
        }
    });

    provideUserStoreContext({
        getMe: () => {
            const user = currentUser.current;
            const me = user?.authenticated ? user : lastAuthenticated;
            return me ? { id: me.id, name: me.name } : undefined;
        }
    });
</script>

{#if status === 'authenticated'}
    <!-- Remount the whole guarded subtree when the identity changes. -->
    {#key userId}
        {@render children?.()}
    {/key}
{:else if status === 'error'}
    <CenteredLayout>
        <ErrorCard error={currentUser.error}>
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
