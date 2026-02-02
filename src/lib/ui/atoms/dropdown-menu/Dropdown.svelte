<script module lang="ts">
    import { DropdownMenu as DropdownMenuPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
    import type { ClassValue } from 'clsx';
    import { type Snippet } from 'svelte';
    import { fade } from 'svelte/transition';
    import { type ButtonStyleConfig, createButtonStyle } from '@lib/ui/atoms/input/style.svelte';
    import { type AsChildSnippet, cn, createContext, isAsChildSnippet } from '@lib/ui/utils';

    export type MenuProps = WithoutChildrenOrChild<DropdownMenuPrimitive.RootProps> &
        WithoutChildrenOrChild<DropdownMenuPrimitive.ContentProps> & {
            to?: string;
            trigger?: string | Snippet<[{ class: string }]> | AsChildSnippet;
            triggerStyle?: ButtonStyleConfig;
            children?: Snippet;
            class?: ClassValue;
        };

    const { get: getMenuContext, set: setMenuContext } = createContext<{ portal: string }>('DropdownMenu');
    export { getMenuContext };
</script>

<script lang="ts">
    let {
        to = '#popover',
        open = $bindable(false),
        onOpenChange,
        onOpenChangeComplete,
        sideOffset = 4,
        trigger,
        triggerStyle,
        children,
        class: className,
        ...restProps
    }: MenuProps = $props();

    setMenuContext({
        get portal() {
            return to;
        }
    });

    const triggerStl = createButtonStyle(() => ({
        ...triggerStyle,
        useGroupFocus: typeof trigger !== 'string' && !isAsChildSnippet(trigger)
    }));

    const contentColor = 'container';
    const contentCls = $derived(
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
    {#if typeof trigger === 'string'}
        <DropdownMenuPrimitive.Trigger
            data-slot="dropdown-menu-trigger"
            disabled={triggerStyle?.disabled}
            class={triggerStl.class}
        >
            {trigger}
        </DropdownMenuPrimitive.Trigger>
    {:else if isAsChildSnippet(trigger)}
        <DropdownMenuPrimitive.Trigger
            data-slot="dropdown-menu-trigger"
            disabled={triggerStyle?.disabled}
            class={triggerStl.class}
        >
            {@render trigger.asChild()}
        </DropdownMenuPrimitive.Trigger>
    {:else}
        <DropdownMenuPrimitive.Trigger
            data-slot="dropdown-menu-trigger"
            disabled={triggerStyle?.disabled}
            class="group focus-visible:ring-0 outline-none"
        >
            {@render trigger?.({ class: triggerStl.class })}
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
