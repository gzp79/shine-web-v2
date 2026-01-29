<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { setCurrentUserStore } from '@lib/account/currentUser.svelte';
    import { t } from '@lib/i18n/i18n.svelte';
    import { logUser } from '@lib/loggers';
    import MessageContent from '@lib/ui/app/MessageContent.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import ErrorCard from '@lib/ui/components/ErrorCard.svelte';
    import LoadingCard from '@lib/ui/components/LoadingCard.svelte';
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
        <MessageContent>
            <ErrorCard error={createAppError(error)} width="full">
                <Button
                    onclick={async () => {
                        await currentUser.refresh();
                        reset();
                    }}>{$t('common.refresh')}</Button
                >
            </ErrorCard>
        </MessageContent>
    {/snippet}

    {#snippet pending()}
        <MessageContent>
            <LoadingCard />
        </MessageContent>
    {/snippet}

    {#await currentUser then user}
        {#if user.authenticated}
            {@render children()}
        {:else}
            <MessageContent>
                <LoadingCard />
            </MessageContent>
        {/if}
    {/await}
</svelte:boundary>
