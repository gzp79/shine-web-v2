<script lang="ts">
    import { getChatStream } from '@lib/builder';
    import Chat from '@lib/builder/chat/Chat.svelte';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';

    const chat = getChatStream();
</script>

<CenteredLayout>
    <Chat {chat} class="h-full max-h-[40rem] w-full max-w-2xl" />
</CenteredLayout>
