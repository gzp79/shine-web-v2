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

    const text = $derived(locale.t('chat.pong', { ms: message.roundTripMs }));
</script>

<ChatBubble {text} align={own ? 'end' : 'start'} author={userLabel} />

{#snippet userLabel()}
    <UserName id={message.initiator} selfLabel={locale.t('chat.you')} /> →
    <UserName id={message.from} selfLabel={locale.t('chat.you')} />
{/snippet}
