<script module lang="ts">
    import type { Snippet } from 'svelte';
    import ChatBubble from './ChatBubble.svelte';
    import type { TextMessage } from './chatMessages';

    export type ChatMessageProps = {
        message: TextMessage;
        own: boolean;
        /** Resolves the author label for a user id. */
        user: Snippet<[string]>;
    };
</script>

<script lang="ts">
    let { message, own, user }: ChatMessageProps = $props();
</script>

<ChatBubble text={message.text} align={own ? 'end' : 'start'} author={userLabel} />

{#snippet userLabel()}
    {@render user(message.from)}
{/snippet}
