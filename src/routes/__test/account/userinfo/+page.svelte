<script lang="ts">
    import LogoutGuard from '$lib/account/LogoutGuard.svelte';
    import UserInfoCard from '$lib/account/UserInfoCard.svelte';
    import { setCurrentUserContext } from '$lib/account/currentUserStore.svelte';

    setCurrentUserContext();
</script>

<LogoutGuard>
    <UserInfoCard />
</LogoutGuard>
