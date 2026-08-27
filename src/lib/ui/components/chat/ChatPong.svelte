<script module lang="ts">
    import type { Snippet } from 'svelte';
    import { getLocaleContext } from '@lib/i18n';
    import ChatBubble from './ChatBubble.svelte';
    import type { PongMessage } from './chatMessages';

    export type ChatPongProps = {
        message: PongMessage;
        own: boolean;
        /** Resolves the author label for a user id. */
        user: Snippet<[string]>;
    };
</script>

<script lang="ts">
    let { message, own, user }: ChatPongProps = $props();

    const locale = getLocaleContext();

    const text = $derived(locale.t('chat.pong', { ms: message.roundTripMs }));
</script>

<ChatBubble {text} align={own ? 'end' : 'start'} author={userLabel} />

{#snippet userLabel()}
    {@render user(message.from)}
{/snippet}
