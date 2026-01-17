<script module lang="ts">
    import { DropdownMenu as DropdownMenuPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
    import type { ClassValue } from 'clsx';
    import type { Snippet } from 'svelte';
    import { fade } from 'svelte/transition';
    import { type ExpandIconSide, getPortalContext } from '@lib/ui/atoms/dropdown-menu';
    import DropdownIcon from '@lib/ui/atoms/icons/common/Dropdown.svelte';
    import { cn } from '@lib/ui/utils';
    import './Dropdown.svelte';

    export type SubProps = WithoutChildrenOrChild<DropdownMenuPrimitive.SubProps> &
        DropdownMenuPrimitive.SubContentProps & {
            trigger: string | Snippet;
            triggerClass?: string;
            expandIcon?: ExpandIconSide;
            class?: ClassValue;
        };
</script>

<script lang="ts">
    let {
        open = $bindable(false),
        onOpenChange,
        onOpenChangeComplete,
        trigger,
        triggerClass,
        expandIcon = 'right',
        class: className,
        children,
        ...restProps
    }: SubProps = $props();

    const portalTo = getPortalContext();

    let triggerCls = $derived(
        cn(
            'outline-hidden flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
            'data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
            'data-highlighted:bg-sub-container data-highlighted:text-on-sub-container',
            'data-disabled:!opacity-30 data-disabled:!cursor-not-allowed',
            triggerClass
        )
    );

    const color = 'container';
    let contentCls = $derived(
        cn(
            'overflow-y-auto overflow-x-hidden',
            `bg-${color} text-on-${color} `,
            'max-h-(--bits-floating-available-height) origin-(--bits-floating-transform-origin) min-w-32',
            'data-[side=bottom]:slide-in-from-top-2',
            'data-[side=left]:slide-in-from-end-2',
            'data-[side=right]:slide-in-from-start-2',
            'data-[side=top]:slide-in-from-bottom-2',
            className
        )
    );
</script>

<DropdownMenuPrimitive.Sub bind:open {onOpenChange} {onOpenChangeComplete}>
    <DropdownMenuPrimitive.SubTrigger data-slot="dropdown-menu-sub-trigger" class={triggerCls}>
        {#if expandIcon === 'left'}
            <DropdownIcon class="size-4 rotate-90" />
        {/if}
        {#if typeof trigger === 'string'}
            {trigger}
        {:else}
            {@render trigger()}
        {/if}
        {#if expandIcon === 'right'}
            <DropdownIcon class="ms-auto size-4 -rotate-90" />
        {/if}
    </DropdownMenuPrimitive.SubTrigger>

    <DropdownMenuPrimitive.Portal to={portalTo}>
        <DropdownMenuPrimitive.SubContent
            forceMount
            data-slot="dropdown-menu-sub-content"
            class={contentCls}
            {...restProps}
        >
            {#snippet child({ props, wrapperProps, open: contentOpen })}
                {#if contentOpen}
                    <div
                        {...wrapperProps}
                        class="overflow-clip rounded-md border shadow-sm shadow-on-surface outline-none"
                        transition:fade
                    >
                        <div {...props}>
                            {@render children?.()}
                        </div>
                    </div>
                {/if}
            {/snippet}
        </DropdownMenuPrimitive.SubContent>
    </DropdownMenuPrimitive.Portal>
</DropdownMenuPrimitive.Sub>
