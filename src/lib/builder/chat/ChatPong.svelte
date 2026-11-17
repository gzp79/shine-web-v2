<script module lang="ts">
    import UserName from '#lib/account/UserName.svelte';
    import { getLocaleContext } from '#lib/i18n';
    import { ChatBubble } from '#lib/ui/components/chat';

    export type ChatPongProps = {
        /** Id of the user who answered. */
        from: string;
        /** The round trip the pong measured. */
        roundTripMs: number;
        own: boolean;
    };
</script>

<script lang="ts">
    let { from, roundTripMs, own }: ChatPongProps = $props();

    const locale = getLocaleContext();

    const you = $derived(locale.t('chat.you'));
    const duration = $derived(locale.t('chat.pong', { ms: roundTripMs }));
</script>

<ChatBubble {content} align={own ? 'end' : 'start'} author={userLabel} />

{#snippet userLabel()}
    <UserName id={from} selfLabel={you} />
{/snippet}

<!-- `own` is our own pong echo (a server round-trip), otherwise a peer answered our ping (a full round-trip). -->
{#snippet content()}
    <span class="whitespace-normal">
        {#if own}
            {you} → {locale.t('chat.server')} → {you} · {duration}
        {:else}
            {you} → <UserName id={from} selfLabel={you} /> → {you} · {duration}
        {/if}
    </span>
{/snippet}
