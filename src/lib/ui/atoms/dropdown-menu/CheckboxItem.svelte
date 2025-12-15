<script module lang="ts">
    import { DropdownMenu as DropdownMenuPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
    import type { Snippet } from 'svelte';
    import CheckIcon from '@lib/ui/atoms/icons/common/Check.svelte';
    import CrossIcon from '@lib/ui/atoms/icons/common/Cross.svelte';
    import { cn } from '@lib/ui/utils';

    export type CheckboxItemProps = WithoutChildrenOrChild<DropdownMenuPrimitive.CheckboxItemProps> & {
        children?: Snippet;
    };
</script>

<script lang="ts">
    let {
        ref = $bindable(null),
        checked = $bindable(false),
        indeterminate = $bindable(false),
        value,
        class: className,
        children,
        ...restProps
    }: CheckboxItemProps = $props();

    let cls = $derived(
        cn(
            'flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
            'data-highlighted:bg-sub-container data-highlighted:text-on-sub-container',
            'data-disabled:!opacity-30 data-disabled:!cursor-not-allowed',
            className
        )
    );
</script>

<DropdownMenuPrimitive.CheckboxItem
    bind:ref
    bind:checked
    bind:indeterminate
    {value}
    data-slot="dropdown-menu-checkbox-item"
    class={cls}
    {...restProps}
>
    {#snippet child({ checked, indeterminate, props })}
        <div {...props}>
            <span class="pointer-events-none flex size-3.5 items-center justify-center">
                {#if indeterminate}
                    <CrossIcon />
                {:else if checked}
                    <CheckIcon />
                {/if}
            </span>
            {@render children?.()}
        </div>
    {/snippet}
</DropdownMenuPrimitive.CheckboxItem>
