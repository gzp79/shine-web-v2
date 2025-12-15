<script module lang="ts">
    import { DropdownMenu as DropdownMenuPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
    import type { ComponentProps } from 'svelte';
    import { fade } from 'svelte/transition';
    import DropdownMenuPortal from '@lib/ui/atoms/dropdown-menu/Portal.svelte';
    import { cn } from '@lib/ui/utils';

    export type ContentProps = DropdownMenuPrimitive.ContentProps & {
        portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DropdownMenuPortal>>;
    };
</script>

<script lang="ts">
    let {
        sideOffset = 4,
        portalProps,
        class: className,
        ref = $bindable(null),
        children,
        ...restProps
    }: ContentProps = $props();

    const color = 'container';

    let cls = $derived(
        cn(
            'overflow-y-auto overflow-x-hidden',
            `bg-${color} text-on-${color} `,
            'max-h-(--bits-dropdown-menu-content-available-height) origin-(--bits-dropdown-menu-content-transform-origin) min-w-32',
            'data-[side=bottom]:slide-in-from-top-2',
            'data-[side=left]:slide-in-from-end-2',
            'data-[side=right]:slide-in-from-start-2',
            'data-[side=top]:slide-in-from-bottom-2',
            className
        )
    );
</script>

<DropdownMenuPortal {...portalProps}>
    <DropdownMenuPrimitive.Content
        forceMount
        data-slot="dropdown-menu-content"
        bind:ref
        {sideOffset}
        {...restProps}
        class={cls}
    >
        {#snippet child({ open, props, wrapperProps })}
            {#if open}
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
    </DropdownMenuPrimitive.Content>
</DropdownMenuPortal>
