<script lang="ts" module>
    import type { ClassValue } from 'clsx';
    import type { HTMLAttributes } from 'svelte/elements';
    import { type ChildOrChildren, cn, isChildSnippet } from '@lib/ui/utils';

    export type AlertItemProps = HTMLAttributes<HTMLDivElement> & {
        class?: ClassValue;
    } & ChildOrChildren<[{ class: string }]>;
</script>

<script lang="ts">
    let { class: className, 'data-slot': dataSlot, ...restProps }: AlertItemProps = $props();

    let cls = $derived(cn('col-start-2', className));
</script>

{#if isChildSnippet(restProps)}
    {@render restProps.child({ class: cls })}
{:else}
    <div class={cls} {...restProps} data-slot={dataSlot ?? 'alert-item'}>
        {@render restProps.children?.()}
    </div>
{/if}
