<script module lang="ts">
    import type { ClassValue } from 'svelte/elements';
    import UserName from '@lib/account/UserName.svelte';
    import type { ChatStream } from '@lib/builder';
    import { getLocaleContext } from '@lib/i18n';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import { ChatBubble, ChatInput, type ChatListItem, ChatMessageList } from '@lib/ui/components/chat';

    export type ChatProps = {
        /** Current user's id; messages from this id are aligned to the end. */
        selfId: string;
        /** The shared chat stream to render and send through. */
        chat: ChatStream;
        class?: ClassValue;
    };
</script>

<script lang="ts">
    let { selfId, chat, class: className }: ChatProps = $props();

    const locale = getLocaleContext();

    const items = $derived<ChatListItem[]>(
        chat.messages.map((message) => ({
            id: message.id,
            text: message.text,
            own: message.from === selfId,
            authorId: message.from
        }))
    );
</script>

<Stack direction="column" spacing={2} class={className} data-slot="chat">
    <div class="min-h-0 flex-1">
        <ChatMessageList messages={items}>
            {#snippet item(message)}
                <ChatBubble text={message.text} own={message.own}>
                    {#snippet author()}
                        {#if message.authorId}
                            <UserName id={message.authorId} selfLabel={locale.t('chat.you')} />
                        {/if}
                    {/snippet}
                </ChatBubble>
            {/snippet}

            {#snippet empty()}
                <Stack alignment="center" justification="center" class="h-full">
                    <Typography variant="footnote" class="opacity-60">No messages yet.</Typography>
                </Stack>
            {/snippet}
        </ChatMessageList>
    </div>

    <div class="shrink-0">
        <ChatInput onSubmit={(text) => chat.send(text)} />
    </div>
</Stack>
