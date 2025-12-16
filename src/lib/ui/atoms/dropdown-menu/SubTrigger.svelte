<script module lang="ts">
    import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
    import type { ExpandIconSide } from '@lib/ui/atoms/dropdown-menu';
    import DropdownIcon from '@lib/ui/atoms/icons/common/Dropdown.svelte';
    import { cn } from '@lib/ui/utils';

    export type SubTriggerProps = DropdownMenuPrimitive.SubTriggerProps & {
        expandIcon?: ExpandIconSide;
        leftIcon?: boolean;
    };
</script>

<script lang="ts">
    let {
        expandIcon = 'right',
        ref = $bindable(null),
        class: className,
        children,
        ...restProps
    }: SubTriggerProps = $props();

    let cls = $derived(
        cn(
            'outline-hidden flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
            'data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
            'data-highlighted:bg-sub-container data-highlighted:text-on-sub-container',
            'data-disabled:!opacity-30 data-disabled:!cursor-not-allowed',
            className
        )
    );
</script>

<DropdownMenuPrimitive.SubTrigger bind:ref data-slot="dropdown-menu-sub-trigger" class={cls} {...restProps}>
    {#if expandIcon === 'left'}
        <DropdownIcon class="size-4 rotate-90" />
    {/if}
    {@render children?.()}
    {#if expandIcon === 'right'}
        <DropdownIcon class="ms-auto size-4 -rotate-90" />
    {/if}
</DropdownMenuPrimitive.SubTrigger>
