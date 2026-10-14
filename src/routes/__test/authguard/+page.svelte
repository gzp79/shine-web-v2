<script lang="ts">
    import AuthGuard from '#lib/account/AuthGuard.svelte';
    import GuardedContent from './GuardedContent.svelte';
</script>

<AuthGuard>
    <GuardedContent />
</AuthGuard>
