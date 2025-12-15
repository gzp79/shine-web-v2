<script module lang="ts">
    import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

    export type MenuProps = DropdownMenuPrimitive.RootProps;
</script>

<script lang="ts">
    let { open = $bindable(false), ...restProps }: MenuProps = $props();
</script>

<DropdownMenuPrimitive.Root bind:open {...restProps} />
