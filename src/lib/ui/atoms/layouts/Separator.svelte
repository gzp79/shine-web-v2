<script module lang="ts">
    import { Separator as SeparatorPrimitive } from 'bits-ui';
    import { cn } from '@lib/ui/utils';

    export type SeparatorProps = SeparatorPrimitive.RootProps & {
        variant?: 'default' | 'subtle';
    };
</script>

<script lang="ts">
    let {
        ref = $bindable(null),
        class: className,
        variant = 'default',
        'data-slot': dataSlot = 'separator',
        ...restProps
    }: SeparatorProps = $props();

    const cls = $derived(
        cn(
            'shrink-0 data-[orientation=horizontal]:w-full data-[orientation=vertical]:min-h-full',
            variant === 'default' &&
                'bg-sub-container data-[orientation=horizontal]:h-px data-[orientation=vertical]:w-px',
            variant === 'subtle' && 'data-[orientation=horizontal]:h-[2px] data-[orientation=vertical]:w-[2px]',
            variant === 'subtle' && 'bg-gradient-to-r from-transparent via-white/60 to-transparent',
            variant === 'subtle' && 'shadow-[0_0_12px_rgba(255,255,255,0.5)]',
            className
        )
    );
</script>

<SeparatorPrimitive.Root bind:ref data-slot={dataSlot} class={cls} {...restProps} />
