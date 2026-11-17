<script module lang="ts">
    import { gameInputGate } from '#lib/game';
    import { getLocaleContext } from '#lib/i18n';
    import Dialog from '#lib/ui/atoms/layouts/Dialog.svelte';
    import { getBuilderStreamHubContext } from '../streamHub';
    import Chat from './Chat.svelte';
    import { ChatStream } from './chatStream.svelte';

    export type ChatPanelProps = {
        /** Bindable open state, driven by the app-shell connection-status button. */
        open?: boolean;
    };
</script>

<script lang="ts">
    let { open = $bindable(false) }: ChatPanelProps = $props();

    const locale = getLocaleContext();

    // The room lives as long as the panel: it is joined on mount and left on destroy, so the unread
    // marker keeps counting while the dialog is closed.
    const chat = new ChatStream(getBuilderStreamHubContext());

    /** Messages of other users arrived while the panel was closed. */
    export function hasUnread(): boolean {
        return chat.hasUnread;
    }

    $effect(() => {
        chat.start();
        return () => chat.destroy();
    });

    // Keep the unread marker cleared while the panel is open, so messages arriving in real
    // time never flip the badge back on behind the user's back.
    $effect(() => {
        if (open) {
            void chat.messages;
            chat.markAllRead();
        }
    });

    // While the chat is open, suspend the embedded game's input so keystrokes reach the chat's
    // fields (and the camera doesn't move behind the overlay). The cleanup releases the claim when
    // the panel closes or unmounts.
    $effect(() => {
        if (!open) return;
        return gameInputGate.suspend();
    });
</script>

<Dialog bind:open title={locale.t('chat.chat')} closeIcon width="sm">
    <Chat {chat} class="h-[28rem] max-h-[70vh] w-full" />
</Dialog>
