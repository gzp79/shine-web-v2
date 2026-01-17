<script module lang="ts">
    import { DropdownMenu as DropdownMenuPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
    import type { ClassValue } from 'clsx';
    import { type Snippet, createContext } from 'svelte';
    import { fade } from 'svelte/transition';
    import { cn } from '@lib/ui/utils';
    import { getButtonStyle } from '../input/Button.svelte';

    export type MenuProps = WithoutChildrenOrChild<DropdownMenuPrimitive.RootProps> &
        WithoutChildrenOrChild<DropdownMenuPrimitive.ContentProps> & {
            to: string;
            trigger?: Snippet;
            triggerClass?: ClassValue;
            children?: Snippet;
            class?: ClassValue;
        };

    const [getContext, setContext] = createContext<() => string>();
    export const getPortalContext = (): string => getContext()();
</script>

<script lang="ts">
    let {
        open = $bindable(false),
        onOpenChange,
        onOpenChangeComplete,
        sideOffset = 4,
        to = '#popover',
        trigger,
        triggerClass,
        children,
        class: className,
        ...restProps
    }: MenuProps = $props();

    setContext(() => to);

    let triggerCls = $derived(getButtonStyle({ class: triggerClass }, 'root'));

    const contentColor = 'container';
    let contentCls = $derived(
        cn(
            'overflow-y-auto overflow-x-hidden',
            `bg-${contentColor} text-on-${contentColor} `,
            'max-h-(--bits-dropdown-menu-content-available-height) origin-(--bits-dropdown-menu-content-transform-origin) min-w-32',
            'data-[side=bottom]:slide-in-from-top-2',
            'data-[side=left]:slide-in-from-end-2',
            'data-[side=right]:slide-in-from-start-2',
            'data-[side=top]:slide-in-from-bottom-2',
            className
        )
    );
</script>

<DropdownMenuPrimitive.Root bind:open {onOpenChange} {onOpenChangeComplete}>
    {#if trigger}
        <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" class={triggerCls}>
            {@render trigger()}
        </DropdownMenuPrimitive.Trigger>
    {/if}

    <DropdownMenuPrimitive.Portal {to}>
        <DropdownMenuPrimitive.Content
            forceMount
            data-slot="dropdown-menu-content"
            {sideOffset}
            class={contentCls}
            {...restProps}
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
    </DropdownMenuPrimitive.Portal>
</DropdownMenuPrimitive.Root>
