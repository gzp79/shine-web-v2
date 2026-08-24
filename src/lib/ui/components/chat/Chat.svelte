<script module lang="ts">
    import { onMount } from 'svelte';
    import type { ClassValue } from 'svelte/elements';
    import { BuilderChatConnection } from '@lib/builder';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Spinner from '@lib/ui/atoms/icons/animated/Spinner.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import { shortenString } from '@lib/ui/utils';
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
            // Placeholder for a future <User /> component; show a shortened id for now.
            author: message.from === selfId ? 'You' : shortenString(message.from, 12)
        }))
    );

    const statusLabel = $derived(
        {
            idle: 'Not connected',
            connecting: 'Connecting…',
            connected: 'Connected',
            reconnecting: 'Reconnecting…',
            closed: 'Disconnected'
        }[chat.status]
    );

    const busy = $derived(chat.status === 'connecting' || chat.status === 'reconnecting');
</script>

<Stack direction="column" spacing={2} class={className} data-slot="chat">
    <Stack direction="row" spacing={2} alignment="center" class="shrink-0">
        {#if busy}
            <Spinner class="h-4 w-4" />
        {/if}
        <Typography variant="footnote" class="opacity-70">{statusLabel}</Typography>
    </Stack>

    <div class="min-h-0 flex-1">
        <ChatMessageList messages={items}>
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
