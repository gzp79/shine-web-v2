<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { setCurrentUserStore } from '@lib/account/currentUser.svelte';
    import { logUser } from '@lib/loggers';
    import Button from '@lib/ui/atoms/input/Button.svelte';

    let { children } = $props();

    let currentUser = setCurrentUserStore();
    let unauthenticated = $derived(!currentUser.error && !currentUser.isAuthenticated());

    $effect(() => {
        if (currentUser.loading) {
            return;
        }

        if (unauthenticated) {
            logUser.log('User is unauthenticated, redirecting to login page');
            goto(resolve('/login'));
        }
    });
</script>

{#if currentUser.loading || unauthenticated}
    LOADING...
{:else if currentUser.error}
    {JSON.stringify(currentUser.error)}
    <Button
        disabled={currentUser.loading}
        onclick={() => {
            currentUser.refresh();
        }}
    >
        Refresh
    </Button>
{:else}
    {@render children()}
{/if}
