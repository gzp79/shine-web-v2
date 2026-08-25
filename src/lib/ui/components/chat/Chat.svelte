<script module lang="ts">
    import { onMount } from 'svelte';
    import type { ClassValue } from 'svelte/elements';
    import { BuilderChatConnection } from '@lib/builder';
    import { getLocaleContext } from '@lib/i18n';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import { UserName } from '@lib/ui/components/user';
    import ChatBubble from './ChatBubble.svelte';
    import ChatInput from './ChatInput.svelte';
    import ChatMessageList, { type ChatListItem } from './ChatMessageList.svelte';

    export type ChatProps = {
        /** Current user's id; messages from this id are aligned to the end. */
        selfId: string;
        /**
         * Provide a connection to reuse an existing one; otherwise a builder connection is created
         * and owned by this component (connected on mount, disposed on destroy).
         */
        connection?: BuilderChatConnection;
        class?: ClassValue;
    };
</script>

<script lang="ts">
    let { selfId, connection, class: className }: ChatProps = $props();

    const locale = getLocaleContext();

    // Own the connection only when the caller did not supply one. The prop is read once
    // by design: a chat instance is bound to a single connection for its lifetime.
    // svelte-ignore state_referenced_locally
    const owned = connection === undefined;
    // svelte-ignore state_referenced_locally
    const chat = connection ?? new BuilderChatConnection();

    onMount(() => {
        if (owned) {
            chat.connect();
            return () => chat.destroy();
        }
    });

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
