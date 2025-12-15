<script module lang="ts">
    import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

    export type CheckboxGroupProps = DropdownMenuPrimitive.CheckboxGroupProps;
</script>

<script lang="ts">
    let { ref = $bindable(null), value = $bindable([]), ...restProps }: CheckboxGroupProps = $props();
</script>

<DropdownMenuPrimitive.CheckboxGroup bind:ref bind:value data-slot="dropdown-menu-checkbox-group" {...restProps} />
