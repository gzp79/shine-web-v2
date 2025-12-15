<script lang="ts">
    import { type Snippet, onMount } from 'svelte';
    import { getAppToolbarContext } from './App.svelte';

    interface Props {
        children: Snippet;
    }

    let { children }: Props = $props();

    const context = getAppToolbarContext();
    if (!context) {
        throw new Error('AppToolbar must be used within an App component');
    }

    onMount(() => {
        const version = context.setToolbar(children);
        return () => {
            context.resetToolbar(version);
        };
    });
</script>

<!--
    No visual output; this component only sets the toolbar content in the App context.
-->
