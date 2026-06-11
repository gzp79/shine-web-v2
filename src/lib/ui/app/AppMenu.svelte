<script module lang="ts">
    import { type Component, untrack } from 'svelte';
    import LanguageMenu from '@lib/i18n/LanguageMenu.svelte';
    import ThemeMenu from '@lib/theme/ThemeMenu.svelte';
    import { DropdownItem, DropdownMenu, DropdownSeparator } from '@lib/ui/atoms/dropdown-menu';
    import Hamburger from '@lib/ui/atoms/icons/common/Hamburger.svelte';
    import { createContext, fromComponent } from '@lib/ui/utils';
    import FullscreenMenu from './FullscreenMenu.svelte';

    export type MenuSection = 'global' | 'context' | 'user';

    /// A single menu item which can be registered/unregistered.
    /// To keep reactivity use getters instead of properties for dynamic menu items
    export type MenuItem = {
        id: string;
        section: MenuSection;

        label: string;
        icon?: Component;

        dangerous?: boolean;
        disabled?: boolean;

        action?: () => void | Promise<void>;
    };

    export type MenuContext = {
        register: (item: MenuItem) => () => void;
        unregister: (id: string) => boolean;
        has: (id: string) => boolean;
        getItems: () => MenuItem[];
        getItemsBySection: (section: MenuSection) => MenuItem[];
    };

    const { get: getMenuContext, set: setMenuContext } = createContext<MenuContext>('menu-context');
    export { getMenuContext };
    export function createMenuContext(): MenuContext {
        let items = $state<MenuItem[]>([]);

        const ctx: MenuContext = {
            register(item: MenuItem) {
                items = untrack(() => [...items.filter((i) => i.id !== item.id), item]);

                // Return unregister function
                return () => {
                    ctx.unregister(item.id);
                };
            },

            unregister(id: string) {
                const initialLength = untrack(() => items.length);
                items = untrack(() => items.filter((i) => i.id !== id));
                return items.length < initialLength;
            },

            has(id: string) {
                return items.some((i) => i.id === id);
            },

            getItems() {
                return items;
            },

            getItemsBySection(section: MenuSection) {
                return items.filter((item) => item.section === section);
            }
        };

        setMenuContext(ctx);
        return ctx;
    }

    export type AppMenuProps = {
        collisionPadding?: number;
    };
</script>

<script lang="ts">
    let { collisionPadding = 16 }: AppMenuProps = $props();

    const menuContext = getMenuContext();

    const globalItems = $derived(menuContext.getItemsBySection('global'));
    const contextItems = $derived(menuContext.getItemsBySection('context'));
    const userItems = $derived(menuContext.getItemsBySection('user'));
</script>

{#snippet menuItem(item: MenuItem)}
    <DropdownItem onclick={item.action} disabled={item.disabled} dangerous={item.dangerous}>
        {#if item.icon}
            {@const Icon = item.icon}
            <Icon />
        {/if}
        {item.label}
    </DropdownItem>
{/snippet}

<DropdownMenu
    trigger={fromComponent(Hamburger)}
    triggerStyle={{ class: 'absolute right-0 top-0 z-[10000] gap-0 h-8 w-8 p-0 m-4 rounded-sm' }}
    to="#popover"
    side="left"
    {collisionPadding}
>
    <!-- Setting section -->

    <FullscreenMenu />
    <ThemeMenu expandIcon="left" />
    <LanguageMenu expandIcon="left" />
    {#each globalItems as item (item.id)}
        {@render menuItem(item)}
    {/each}

    <!-- Context section -->
    {#if contextItems.length > 0}
        <DropdownSeparator />
        {#each contextItems as item (item.id)}
            {@render menuItem(item)}
        {/each}
    {/if}

    <!-- User section -->
    {#if userItems.length > 0}
        <DropdownSeparator />
        {#each userItems as item (item.id)}
            {@render menuItem(item)}
        {/each}
    {/if}
</DropdownMenu>
