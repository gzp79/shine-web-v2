<script lang="ts" module>
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import AlertItem, { type AlertItemProps } from '@lib/ui/atoms/data/alert/AlertItem.svelte';
    import { cn } from '@lib/ui/utils';

    export type AlertDescriptionProps = Omit<AlertItemProps, 'data-slot' | 'children' | 'child'>;
</script>

<script lang="ts">
    let { children, class: className, ...restProps }: AlertDescriptionProps = $props();
    let cls = $derived(cn(className));
</script>

<AlertItem data-slot="alert-description" class={cls} {...restProps}>
    {#snippet child({ class: cls })}
        <Typography element="p" variant="text" class={cls}>
            {@render children?.()}
        </Typography>
    {/snippet}
</AlertItem>
