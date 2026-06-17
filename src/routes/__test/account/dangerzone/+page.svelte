<script lang="ts">
    import AuthGuard from '$lib/account/AuthGuard.svelte';
    import DangerZoneCard from '$lib/account/DangerZoneCard.svelte';
</script>

<AuthGuard>
    <DangerZoneCard />
</AuthGuard>
