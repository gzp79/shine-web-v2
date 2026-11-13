<script module lang="ts">
    import UserName from '#lib/account/UserName.svelte';
    import { getLocaleContext } from '#lib/i18n';
    import { ChatBubble } from '#lib/ui/components/chat';
    import type { ChatEntry } from './chatReplica';

    export type ChatMessageProps = {
        message: ChatEntry;
        /** The current user wrote it. */
        own: boolean;
    };
</script>

<script lang="ts">
    let { message, own }: ChatMessageProps = $props();

    const locale = getLocaleContext();
</script>

<ChatBubble
    content={message.text}
    align={own ? 'end' : 'start'}
    author={userLabel}
    class={message.pending ? 'opacity-60' : undefined}
/>

{#snippet userLabel()}
    <UserName id={message.from} selfLabel={locale.t('chat.you')} />
{/snippet}
