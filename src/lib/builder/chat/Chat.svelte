<script module lang="ts">
    import type { ClassValue } from 'svelte/elements';
    import UserName from '@lib/account/UserName.svelte';
    import type { ChatStream } from '@lib/builder';
    import { getLocaleContext } from '@lib/i18n';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import { ChatInput, ChatMessageList } from '@lib/ui/components/chat';

    export type ChatProps = {
        /** The shared chat stream to render and send through. */
        chat: ChatStream;
        class?: ClassValue;
    };
</script>

<script lang="ts">
    let { chat, class: className }: ChatProps = $props();

    const locale = getLocaleContext();
</script>

<Stack direction="column" spacing={2} class={className} data-slot="chat">
    <div class="min-h-0 flex-1">
        <ChatMessageList messages={chat.messages} selfId={chat.selfId ?? ''}>
            {#snippet user(id)}
                <UserName {id} selfLabel={locale.t('chat.you')} />
            {/snippet}
        </ChatMessageList>
    </div>

    <div class="shrink-0">
        <ChatInput onSubmit={(text) => chat.send(text)} />
    </div>
</Stack>
