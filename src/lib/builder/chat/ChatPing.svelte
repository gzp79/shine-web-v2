<script module lang="ts">
    import UserName from '#lib/account/UserName.svelte';
    import { getLocaleContext } from '#lib/i18n';
    import { ChatBubble } from '#lib/ui/components/chat';

    export type ChatPingProps = {
        /** Id of the user who pinged. */
        from: string;
        /** The server round trip, known on the sender's own ping. */
        selfMs?: number;
        own: boolean;
    };
</script>

<script lang="ts">
    let { from, selfMs, own }: ChatPingProps = $props();

    const locale = getLocaleContext();

    const text = $derived(selfMs === undefined ? locale.t('chat.pinged') : locale.t('chat.pingSelf', { ms: selfMs }));
</script>

<ChatBubble content={text} align={own ? 'end' : 'start'} author={userLabel} />

{#snippet userLabel()}
    <UserName id={from} selfLabel={locale.t('chat.you')} />
{/snippet}
