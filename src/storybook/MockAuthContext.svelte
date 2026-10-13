<script lang="ts">
    import type { Snippet } from 'svelte';
    import { type AuthenticatedCurrentUser, setAuthenticatedUserContext } from '@lib/account/authContext.svelte';

    let {
        user,
        loading = false,
        children
    }: { user: AuthenticatedCurrentUser; loading?: boolean; children: Snippet } = $props();

    setAuthenticatedUserContext({
        get user() {
            return user;
        },
        get loading() {
            return loading;
        },
        refresh: () => Promise.resolve(),
        revalidateSession: () => Promise.resolve(true)
    });
</script>

{@render children()}
