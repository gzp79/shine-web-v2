<script module lang="ts">
    import type { SocketStatus } from '@lib/builder';
    import { createContext } from '@lib/ui/utils';

    /** Live status a descendant region publishes for the app-shell indicator to reflect. */
    export type ConnectionStatusSource = {
        readonly status: SocketStatus;
        readonly hasUnread: boolean;
        readonly onClick: () => void;
    };

    export type ConnectionStatusContext = {
        readonly source: ConnectionStatusSource | undefined;
        set: (source: ConnectionStatusSource | undefined) => void;
    };

    const { get: getConnectionStatusContext, set: setConnectionStatusContext } =
        createContext<ConnectionStatusContext>('connection-status-context');
    export { getConnectionStatusContext };

    /**
     * Creates the shared connection-status slot and publishes it via context. Call once from
     * the app shell (see {@link ConnectionStatus}). A descendant region (e.g. the auth layout)
     * later calls `set()` to publish its live status; until then the indicator renders nothing.
     */
    export function createConnectionStatusContext(): ConnectionStatusContext {
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
    import { getLocaleContext } from '@lib/i18n';
    import ConnectionConnecting from '@lib/ui/atoms/icons/common/ConnectionConnecting.svelte';
    import ConnectionOffline from '@lib/ui/atoms/icons/common/ConnectionOffline.svelte';
    import ConnectionOnline from '@lib/ui/atoms/icons/common/ConnectionOnline.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';

    export type ConnectionStatusProps = {
        class?: ClassValue;
    };

    let { class: className }: ConnectionStatusProps = $props();

    const ctx = getConnectionStatusContext();
    const locale = getLocaleContext();

    const status = $derived(ctx.source?.status);
</script>

{#if ctx.source}
    <Button
        type="button"
        aria-label={locale.t('chat.chat')}
        // disabled={!ctx.source}
        class={['relative', className]}
        onclick={() => ctx.source?.onClick()}
    >
        {#if status === 'connecting' || status === 'reconnecting'}
            <ConnectionConnecting class="animate-spin" />
        {:else if status === 'connected'}
            <ConnectionOnline />
        {:else}
            <ConnectionOffline />
        {/if}
        {#if ctx.source?.hasUnread}
            <span
                class="absolute right-0.5 top-0.5 z-10 h-3 w-3 rounded-full border-2 border-surface bg-danger-2"
                aria-hidden="true"
            ></span>
        {/if}
    </Button>
{/if}
