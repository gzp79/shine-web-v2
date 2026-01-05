<script module lang="ts">
    import type { Snippet } from 'svelte';
    import type { Spacing } from '@lib/ui/atoms';

    type MarginDecoratorProps = {
        margin?: Spacing;
        children: Snippet;
    };
</script>

<script lang="ts">
    let { margin = 4, children }: MarginDecoratorProps = $props();
</script>

<div class={`m-${margin}`}>
    {@render children()}
</div>
