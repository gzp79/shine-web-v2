<script module lang="ts">
    import type { ClassValue } from 'clsx';
    import type { Snippet } from 'svelte';
    import { type Size } from '@lib/ui/atoms';
    import { cn } from '@lib/ui/utils';
    import TailwindClasses from '@lib/ui/utils/TailwindClasses.svelte';

    export type DescriptionListItem = {
        /** Label for the item */
        key: string;
        /** Additional CSS classes for the key cell */
        keyClass?: ClassValue;
        /** Value for the item, either as a string or a Svelte snippet */
        value: string | Snippet;
        /** Additional CSS classes for the value cell */
        valueClass?: ClassValue;
    };

    export type PropertyListProps = {
        /** List of items to display */
        items: (DescriptionListItem | null)[];
        /** Size of the list */
        size?: Size;
        /** Whether the table should take full width of its container */
        wide?: boolean;
        /** Additional CSS classes for the table */
        class?: ClassValue;
    };
</script>

<script lang="ts">
    const { items, size = 'md', wide = false, class: className }: PropertyListProps = $props();

    const filteredItems = $derived((items ?? []).filter((x) => x !== null) as DescriptionListItem[]);
    const dlClass = $derived(cn('grid grid-cols-[1fr_2fr] gap-1', wide ? 'w-full' : 'max-w-full w-fit', className));
</script>

<TailwindClasses classList={['table-xs', 'table-sm', 'table-md', 'table-lg']} />

<dl class={dlClass} role="region">
    {#each filteredItems as item (item.key)}
        <dt class={cn(`truncate text-${size} font-bold`, item.keyClass)} title={item.key}>
            {item.key}
        </dt>
        {#if typeof item.value === 'string'}
            <dd class={cn(`text-${size} [word-break:break-word]`, item.valueClass)}>
                {item.value}
            </dd>
        {:else}
            <dd class={cn(`text-${size} [word-break:break-word] min-w-0`, item.valueClass)}>
                {@render item.value()}
            </dd>
        {/if}
    {/each}
</dl>
