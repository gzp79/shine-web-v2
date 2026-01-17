<script module lang="ts">
    import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
    import type { Snippet } from 'svelte';
    import { cn } from '@lib/ui/utils';

    export type GroupProps = DropdownMenuPrimitive.GroupProps & {
        heading?: string | Snippet;
        headingClass?: string;
    };
</script>

<script lang="ts">
    let {
        ref = $bindable(null),
        heading,
        headingClass,
        class: className,
        children,
        ...restProps
    }: GroupProps = $props();

    let headingCls = $derived(cn('px-2 py-1.5 text-sm font-semibold', headingClass));
</script>

<DropdownMenuPrimitive.Group bind:ref data-slot="dropdown-menu-group" class={className} {...restProps}>
    {#if heading}
        <DropdownMenuPrimitive.GroupHeading data-slot="dropdown-menu-group-heading" class={headingCls}>
            {#if typeof heading === 'string'}
                {heading}
            {:else}
                {@render heading()}
            {/if}
        </DropdownMenuPrimitive.GroupHeading>
    {/if}
    {@render children?.()}
</DropdownMenuPrimitive.Group>
