<script lang="ts" generics="T">
    import type { Snippet } from 'svelte';

    interface Props<T> {
        use: () => T;
        children: Snippet;
    }
    let { children, use: useContext }: Props<T> = $props();

    useContext();
</script>

{@render children()}
