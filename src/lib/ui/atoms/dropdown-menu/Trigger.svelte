<script module lang="ts">
    import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
    import { type ButtonStyleParams, getStyle } from '@lib/ui/atoms/input/Button.svelte';

    export type TriggerProps = DropdownMenuPrimitive.TriggerProps & ButtonStyleParams;
</script>

<script lang="ts">
    let {
        color: baseColor = undefined,
        variant = 'filled',
        size = 'md',
        wide = false,
        disabled = false,
        highlight = false,
        ref = $bindable(null),
        ...restProps
    }: TriggerProps = $props();

    let cls = $derived(
        getStyle({
            size,
            wide,
            variant,
            color: baseColor,
            disabled,
            highlight
        })
    );
</script>

<DropdownMenuPrimitive.Trigger bind:ref data-slot="dropdown-menu-trigger" class={cls} {...restProps} />
