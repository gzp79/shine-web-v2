<script module lang="ts">
    import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
    import type { ComponentProps } from 'svelte';
    import { cn } from '@lib/ui/utils';

    export type GroupHeading = ComponentProps<typeof DropdownMenuPrimitive.GroupHeading>;
</script>

<script lang="ts">
    let { ref = $bindable(null), class: className, ...restProps }: GroupHeading = $props();
</script>

<DropdownMenuPrimitive.GroupHeading
    bind:ref
    data-slot="dropdown-menu-group-heading"
    class={cn('px-2 py-1.5 text-sm font-semibold', className)}
    {...restProps}
/>
