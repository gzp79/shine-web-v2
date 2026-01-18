<script module lang="ts">
    import { Separator as SeparatorPrimitive } from 'bits-ui';
    import { cn } from '@lib/ui/utils';

    export type SeparatorProps = SeparatorPrimitive.RootProps;
</script>

<script lang="ts">
    let {
        ref = $bindable(null),
        class: className,
        'data-slot': dataSlot = 'separator',
        ...restProps
    }: SeparatorProps = $props();

    const cls = $derived(
        cn(
            'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:min-h-full data-[orientation=vertical]:w-px',
            className
        )
    );
</script>

<SeparatorPrimitive.Root bind:ref data-slot={dataSlot} class={cls} {...restProps} />
