<script module lang="ts">
    import ChatBubble from './ChatBubble.svelte';

    export type ChatGapProps = {
        /** Placeholder standing in for the undelivered messages. */
        text?: string;
    };
</script>

<script lang="ts">
    let { text = '…' }: ChatGapProps = $props();
</script>

<ChatBubble {text} align="center" />
