<script lang="ts">
    import type { Snippet } from 'svelte';
    import { provideBuilderHubContext } from '#lib/builder';
    import { getLocaleContext } from '#lib/i18n';
    import CenteredLayout from '#lib/ui/app/CenteredLayout.svelte';
    import { getConnectionStatusContext } from '#lib/ui/app/ConnectionStatus.svelte';
    import Button from '#lib/ui/atoms/input/Button.svelte';
    import ErrorCard from '#lib/ui/components/cards/ErrorCard.svelte';

    // Lives below AuthGuard on purpose: the hub opens a WebSocket as soon as
    // authenticated user information is provided.
    let { children }: { children: Snippet } = $props();

    const locale = getLocaleContext();
    const connectionStatus = getConnectionStatusContext();

    const hub = provideBuilderHubContext();

    $effect(() => {
        connectionStatus.set({
            get status() {
                return hub.status;
            }
        });
        return () => connectionStatus.set(undefined);
    });
</script>

<svelte:boundary>
    {#snippet failed(error, reset)}
        <CenteredLayout>
            <ErrorCard {error}>
                <Button onclick={() => reset()}>{locale.t('common.refresh')}</Button>
            </ErrorCard>
        </CenteredLayout>
    {/snippet}

    {@render children()}
</svelte:boundary>
