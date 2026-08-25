<script lang="ts">
    import { getAuthenticatedUserContext } from '@lib/account/authContext.svelte';
    import { useChatConnection } from '@lib/builder';
    import Chat from '@lib/builder/chat/Chat.svelte';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';

    const auth = getAuthenticatedUserContext();
    // Reuse the region-wide connection from the (auth) layout, opening the socket on first use.
    const connection = useChatConnection();
</script>

<CenteredLayout>
    <Chat selfId={auth.user.id} {connection} class="h-full max-h-[40rem] w-full max-w-2xl" />
</CenteredLayout>
