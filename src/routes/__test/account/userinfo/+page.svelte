<script lang="ts">
    import AuthGuard from '$lib/account/AuthGuard.svelte';
    import LogoutGuard from '$lib/account/LogoutGuard.svelte';
    import UserInfoCard from '$lib/account/UserInfoCard.svelte';
</script>

<AuthGuard>
    <LogoutGuard>
        <UserInfoCard />
    </LogoutGuard>
</AuthGuard>
