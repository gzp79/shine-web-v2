<script lang="ts">
    import type { Snippet } from 'svelte';
    import { type AuthenticatedCurrentUser, setAuthenticatedUserContext } from '@lib/account/authContext.svelte';

    let { user, children }: { user: AuthenticatedCurrentUser; children: Snippet } = $props();

    setAuthenticatedUserContext({
        get user() {
            return user;
        },
        refresh: () => Promise.resolve()
    });
</script>

{@render children()}
