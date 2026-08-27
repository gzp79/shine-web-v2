<script lang="ts">
    import { getAuthenticatedUserContext } from '@lib/account/authContext.svelte';
    import { getChatStream } from '@lib/builder';
    import { getLocaleContext } from '@lib/i18n';
    import Dialog from '@lib/ui/atoms/layouts/Dialog.svelte';
    import Chat from './Chat.svelte';

    export type ChatPanelProps = {
        /** Bindable open state, driven by the app-shell connection-status button. */
        open?: boolean;
    };

    let { open = $bindable(false) }: ChatPanelProps = $props();

    const auth = getAuthenticatedUserContext();
    const locale = getLocaleContext();
    const chat = getChatStream();

    chat.bindSelfId(() => auth.user.id);

    // Keep the unread marker cleared while the panel is open, so messages arriving in real
    // time never flip the badge back on behind the user's back.
    $effect(() => {
        if (open) {
            void chat.messages;
            chat.markAllRead();
        }
    });
</script>

<Dialog bind:open title={locale.t('chat.chat')} closeIcon width="sm">
    <Chat {chat} class="h-[28rem] max-h-[70vh] w-full" />
</Dialog>
