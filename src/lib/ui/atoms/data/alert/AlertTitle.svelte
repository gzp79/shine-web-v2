<script lang="ts" module>
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import AlertItem, { type AlertItemBaseProps } from '@lib/ui/atoms/data/alert/AlertItem.svelte';
    import { cn } from '@lib/ui/utils';

    export type AlertTitleProps = Omit<AlertItemBaseProps, 'data-slot'>;
</script>

<script lang="ts">
    let { children, class: className, ...restProps }: AlertTitleProps = $props();

    let cls = $derived(cn('line-clamp-1', className));
</script>

<AlertItem data-slot="alert-title" class={cls} {...restProps}>
    {#snippet child({ class: cls })}
        <Typography element="h2" variant="h3" class={cls}>
            {@render children?.()}
        </Typography>
    {/snippet}
</AlertItem>
