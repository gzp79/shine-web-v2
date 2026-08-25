<script lang="ts">
    import { getAuthenticatedUserContext } from '@lib/account/authContext.svelte';
    import { getLocaleContext } from '@lib/i18n';
    import Dialog from '@lib/ui/atoms/layouts/Dialog.svelte';
    import Chat from './Chat.svelte';
    import type { BuilderChatConnection } from './chatConnection.svelte';

    export type ChatPanelProps = {
        connection: BuilderChatConnection;
        /** Bindable open state, driven by the app-shell connection-status button. */
        open?: boolean;
    };

    let { connection, open = $bindable(false) }: ChatPanelProps = $props();

    const auth = getAuthenticatedUserContext();
    const locale = getLocaleContext();

    // Keep the unread marker cleared while the panel is open, so messages arriving in real
    // time never flip the badge back on behind the user's back.
    $effect(() => {
        if (open) {
            void connection.messages;
            connection.markAllRead();
        }
    });
</script>

<Dialog bind:open title={locale.t('chat.chat')} closeIcon width="sm">
    <Chat selfId={auth.user.id} {connection} class="h-[28rem] max-h-[70vh] w-full" />
</Dialog>
