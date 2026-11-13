<script module lang="ts">
    import type { SocketStatus } from '#lib/builder';
    import { createContext } from '#lib/ui/utils';

    /** Live status a descendant region publishes for the app-shell indicator to reflect. */
    export type ConnectionStatusSource = {
        readonly status: SocketStatus;
    };

    export type ConnectionStatusContext = {
        readonly source: ConnectionStatusSource | undefined;
        set: (source: ConnectionStatusSource | undefined) => void;
    };

    const { get: getConnectionStatusContext, set: setConnectionStatusContext } =
        createContext<ConnectionStatusContext>('ConnectionStatusContext');
    export { getConnectionStatusContext };

    /**
     * Creates the shared connection-status slot and publishes it via context. Call once from
     * the app shell (see {@link ConnectionStatus}). A descendant region (e.g. the auth layout)
     * later calls `set()` to publish its live status; until then the indicator renders nothing.
     */
    export function provideConnectionStatusContext(): ConnectionStatusContext {
        let source = $state<ConnectionStatusSource | undefined>(undefined);

        const ctx: ConnectionStatusContext = {
            get source() {
                return source;
            },
            set(next) {
                source = next;
            }
        };

        setConnectionStatusContext(ctx);
        return ctx;
    }
</script>

<script lang="ts">
    import type { ClassValue } from 'svelte/elements';
    import { getLocaleContext } from '#lib/i18n';
    import ConnectionConnecting from '#lib/ui/atoms/icons/common/ConnectionConnecting.svelte';
    import ConnectionOffline from '#lib/ui/atoms/icons/common/ConnectionOffline.svelte';
    import ConnectionOnline from '#lib/ui/atoms/icons/common/ConnectionOnline.svelte';

    export type ConnectionStatusProps = {
        class?: ClassValue;
    };

    let { class: className }: ConnectionStatusProps = $props();

    const ctx = getConnectionStatusContext();
    const locale = getLocaleContext();

    const status = $derived(ctx.source?.status);
    const label = $derived(
        status === 'connecting' || status === 'reconnecting'
            ? locale.t('connection.connecting')
            : status === 'connected'
              ? locale.t('connection.online')
              : locale.t('connection.offline')
    );
</script>

{#if ctx.source}
    <span role="status" aria-label={label} title={label} class={['relative inline-flex items-center', className]}>
        {#if status === 'connecting' || status === 'reconnecting'}
            <ConnectionConnecting class="animate-spin" />
        {:else if status === 'connected'}
            <ConnectionOnline />
        {:else}
            <ConnectionOffline />
        {/if}
    </span>
{/if}
