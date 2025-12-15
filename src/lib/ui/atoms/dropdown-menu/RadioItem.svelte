<script module lang="ts">
    import { DropdownMenu as DropdownMenuPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
    import type { Snippet } from 'svelte';
    import CheckIcon from '@lib/ui/atoms/icons/common/Check.svelte';
    import { cn } from '@lib/ui/utils';

    export type RadioItemProps = WithoutChildrenOrChild<DropdownMenuPrimitive.RadioItemProps> & {
        children?: Snippet;
    };
</script>

<script lang="ts">
    let { ref = $bindable(null), value, class: className, children, ...restProps }: RadioItemProps = $props();

    let cls = $derived(
        cn(
            'flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
            'data-highlighted:bg-sub-container data-highlighted:text-on-sub-container',
            'data-disabled:!opacity-30 data-disabled:!cursor-not-allowed',
            className
        )
    );
</script>

<DropdownMenuPrimitive.RadioItem bind:ref data-slot="dropdown-menu-radio-item" class={cls} {value} {...restProps}>
    {#snippet child({ checked, props })}
        <div {...props} data-value={value}>
            <span class="pointer-events-none flex size-3.5 items-center justify-center">
                {#if checked}
                    <CheckIcon />
                {/if}
            </span>
            {@render children?.()}
        </div>
    {/snippet}
</DropdownMenuPrimitive.RadioItem>
