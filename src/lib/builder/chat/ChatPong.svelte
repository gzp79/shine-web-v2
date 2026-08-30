<script module lang="ts">
    import UserName from '@lib/account/UserName.svelte';
    import { getLocaleContext } from '@lib/i18n';
    import { ChatBubble } from '@lib/ui/components/chat';
    import type { PongMessage } from './chatMessages';

    export type ChatPongProps = {
        message: PongMessage;
        own: boolean;
    };
</script>

<script lang="ts">
    let { message, own }: ChatPongProps = $props();

    const locale = getLocaleContext();

    const you = $derived(locale.t('chat.you'));
    const duration = $derived(locale.t('chat.pong', { ms: message.roundTripMs }));
</script>

<ChatBubble {content} align={own ? 'end' : 'start'} author={userLabel} />

{#snippet userLabel()}
    <UserName id={message.from} selfLabel={you} />
{/snippet}

<!-- `own` is our own pong echo (a server round-trip), otherwise a peer answered our ping (a full round-trip). -->
{#snippet content()}
    <span class="whitespace-normal">
        {#if own}
            {you} → {locale.t('chat.server')} → {you} · {duration}
        {:else}
            {you} → <UserName id={message.from} selfLabel={you} /> → {you} · {duration}
        {/if}
    </span>
{/snippet}
