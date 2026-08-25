<script lang="ts">
    import { getAuthenticatedUserContext } from '@lib/account/authContext.svelte';
    import { getChatStream } from '@lib/builder';
    import Chat from '@lib/builder/chat/Chat.svelte';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';

    const auth = getAuthenticatedUserContext();
    // Reuse the region-wide chat stream established by the (auth) layout.
    const chat = getChatStream();
</script>

<CenteredLayout>
    <Chat selfId={auth.user.id} {chat} class="h-full max-h-[40rem] w-full max-w-2xl" />
</CenteredLayout>
