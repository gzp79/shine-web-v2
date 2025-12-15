<script module lang="ts">
    import type { WithElementRef } from 'bits-ui';
    import type { HTMLAttributes } from 'svelte/elements';
    import { cn } from '@lib/ui/utils';

    export type LabelProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
    let { ref = $bindable(null), class: className, children, ...restProps }: LabelProps = $props();

    let cls = $derived(
        cn(
            'text-sm font-semibold', //
            'px-2 py-1.5',
            className
        )
    );
</script>

<div bind:this={ref} data-slot="dropdown-menu-label" class={cls} {...restProps}>
    {@render children?.()}
</div>
