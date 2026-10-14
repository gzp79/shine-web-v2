<script lang="ts">
    import { getAuthenticatedUserContext } from '#lib/account/authContext.svelte';

    const auth = getAuthenticatedUserContext();
</script>

<p data-testid="guarded-content">guarded content for {auth.user.name}</p>
