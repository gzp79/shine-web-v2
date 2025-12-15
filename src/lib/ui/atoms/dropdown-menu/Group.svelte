<script module lang="ts">
    import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

    export type GroupProps = DropdownMenuPrimitive.GroupProps;
</script>

<script lang="ts">
    let { ref = $bindable(null), ...restProps }: GroupProps = $props();
</script>

<DropdownMenuPrimitive.Group bind:ref data-slot="dropdown-menu-group" {...restProps} />
