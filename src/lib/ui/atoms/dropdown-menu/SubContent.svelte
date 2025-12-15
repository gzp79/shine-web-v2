<script module lang="ts">
    import { DropdownMenu as DropdownMenuPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
    import type { ComponentProps } from 'svelte';
    import { fade } from 'svelte/transition';
    import DropdownMenuPortal from '@lib/ui/atoms/dropdown-menu/Portal.svelte';
    import { cn } from '@lib/ui/utils';

    export type SubContentProps = DropdownMenuPrimitive.SubContentProps & {
        portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DropdownMenuPortal>>;
    };
</script>

<script lang="ts">
    let { ref = $bindable(null), class: className, portalProps, children, ...restProps }: SubContentProps = $props();

    const color = 'container';

    let cls = $derived(
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

<DropdownMenuPortal {...portalProps}>
    <DropdownMenuPrimitive.SubContent
        forceMount
        bind:ref
        data-slot="dropdown-menu-sub-content"
        class={cls}
        {...restProps}
    >
        {#snippet child({ props, wrapperProps, open })}
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
    </DropdownMenuPrimitive.SubContent>
</DropdownMenuPortal>
