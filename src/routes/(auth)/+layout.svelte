<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { setCurrentUserStore } from '@lib/account/currentUser.svelte';
    import { t } from '@lib/i18n/i18n.svelte';
    import { logUser } from '@lib/loggers';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';
    import LoadingCard from '@lib/ui/components/cards/LoadingCard.svelte';
    import { createAppError } from '@lib/utils';

    let { children } = $props();

    let currentUser = setCurrentUserStore();

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
                    }}>{$t('common.refresh')}</Button
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
