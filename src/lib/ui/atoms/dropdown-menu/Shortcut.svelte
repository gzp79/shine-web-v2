<script module lang="ts">
    import type { WithElementRef } from 'bits-ui';
    import type { HTMLAttributes } from 'svelte/elements';
    import { cn } from '@lib/ui/utils';

    export type ShortcutProps = WithElementRef<HTMLAttributes<HTMLSpanElement>>;
</script>

<script lang="ts">
    let { ref = $bindable(null), class: className, children, ...restProps }: ShortcutProps = $props();
</script>

<span
    bind:this={ref}
    data-slot="dropdown-menu-shortcut"
    class={cn('text-muted-foreground ms-auto text-xs tracking-widest', className)}
    {...restProps}
>
    {@render children?.()}
</span>
