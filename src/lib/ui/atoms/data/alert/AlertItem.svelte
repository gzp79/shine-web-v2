<script lang="ts" module>
    import type { ClassValue } from 'clsx';
    import type { HTMLAttributes } from 'svelte/elements';
    import { type TemplateOrChildren, cn, isTemplateSnippet } from '@lib/ui/utils';

    export type AlertItemBaseProps = HTMLAttributes<HTMLDivElement> & {
        class?: ClassValue;
    };
    export type AlertItemProps = AlertItemBaseProps & TemplateOrChildren<[{ class: string }]>;
</script>

<script lang="ts">
    let { class: className, 'data-slot': dataSlot, ...restProps }: AlertItemProps = $props();

    let cls = $derived(cn('col-start-2', className));
</script>

{#if isTemplateSnippet(restProps)}
    {@render restProps.template({ class: cls })}
{:else}
    <div class={cls} {...restProps} data-slot={dataSlot ?? 'alert-item'}>
        {@render restProps.children?.()}
    </div>
{/if}
