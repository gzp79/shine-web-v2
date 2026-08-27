<script module lang="ts">
    import UserName from '@lib/account/UserName.svelte';
    import { getLocaleContext } from '@lib/i18n';
    import { ChatBubble } from '@lib/ui/components/chat';
    import type { TextMessage } from './chatMessages';

    export type ChatMessageProps = {
        message: TextMessage;
        own: boolean;
    };
</script>

<script lang="ts">
    let { message, own }: ChatMessageProps = $props();

    const locale = getLocaleContext();
</script>

<ChatBubble content={message.text} align={own ? 'end' : 'start'} author={userLabel} />

{#snippet userLabel()}
    <UserName id={message.from} selfLabel={locale.t('chat.you')} />
{/snippet}
