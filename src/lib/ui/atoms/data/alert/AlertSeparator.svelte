<script lang="ts" module>
    import AlertItem, { type AlertItemBaseProps } from '@lib/ui/atoms/data/alert/AlertItem.svelte';
    import { cn } from '@lib/ui/utils';

    export type AlertSeparatorProps = Omit<AlertItemBaseProps, 'data-slot'>;
</script>

<script lang="ts">
    let { class: className, ...restProps }: AlertSeparatorProps = $props();
    let cls = $derived(cn('h-[1px] my-1', className));
</script>

<AlertItem data-slot="alert-separator" role="separator" class={cls} {...restProps}>
    {#snippet template({ class: cls })}
        <hr class={cls} />
    {/snippet}
</AlertItem>
