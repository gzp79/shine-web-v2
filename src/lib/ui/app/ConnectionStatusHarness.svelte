<script lang="ts">
    // Test harness: provides the status context a region would, hands it to the test, and renders the indicator.
    import ConnectionStatus, {
        type ConnectionStatusContext,
        provideConnectionStatusContext
    } from './ConnectionStatus.svelte';

    let { onContext }: { onContext: (context: ConnectionStatusContext) => void } = $props();

    // The callback is only needed once, at creation.
    // svelte-ignore state_referenced_locally
    onContext(provideConnectionStatusContext());
</script>

<ConnectionStatus />
