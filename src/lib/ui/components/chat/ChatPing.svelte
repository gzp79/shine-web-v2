<script module lang="ts">
    import type { Snippet } from 'svelte';
    import { getLocaleContext } from '@lib/i18n';
    import ChatBubble from './ChatBubble.svelte';
    import type { PingMessage } from './chatMessages';

    export type ChatPingProps = {
        message: PingMessage;
        own: boolean;
        /** Resolves the author label for a user id. */
        user: Snippet<[string]>;
    };
</script>

<script lang="ts">
    let { message, own, user }: ChatPingProps = $props();

    const locale = getLocaleContext();

    const text = $derived(
        message.selfMs === undefined ? locale.t('chat.pinged') : locale.t('chat.pingSelf', { ms: message.selfMs })
    );
</script>

<ChatBubble {text} align={own ? 'end' : 'start'} author={userLabel} />

{#snippet userLabel()}
    {@render user(message.from)}
{/snippet}
