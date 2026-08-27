<script module lang="ts">
    import UserName from '@lib/account/UserName.svelte';
    import { getLocaleContext } from '@lib/i18n';
    import { ChatBubble } from '@lib/ui/components/chat';
    import type { PingMessage } from './chatMessages';

    export type ChatPingProps = {
        message: PingMessage;
        own: boolean;
    };
</script>

<script lang="ts">
    let { message, own }: ChatPingProps = $props();

    const locale = getLocaleContext();

    const text = $derived(
        message.selfMs === undefined ? locale.t('chat.pinged') : locale.t('chat.pingSelf', { ms: message.selfMs })
    );
</script>

<ChatBubble content={text} align={own ? 'end' : 'start'} author={userLabel} />

{#snippet userLabel()}
    <UserName id={message.from} selfLabel={locale.t('chat.you')} />
{/snippet}
