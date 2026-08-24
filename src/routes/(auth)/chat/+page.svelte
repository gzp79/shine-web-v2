<script lang="ts">
    import { getAuthenticatedUserContext } from '@lib/account/authContext.svelte';
    import { useChatConnection } from '@lib/builder';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Chat from '@lib/ui/components/chat/Chat.svelte';

    const auth = getAuthenticatedUserContext();
    // Reuse the region-wide connection from the (auth) layout, opening the socket on first use.
    const connection = useChatConnection();
</script>

<CenteredLayout>
    <Chat selfId={auth.user.id} {connection} class="h-full max-h-[40rem] w-full max-w-2xl" />
</CenteredLayout>
