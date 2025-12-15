<script module lang="ts">
    import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

    export type RadioGroupProps = DropdownMenuPrimitive.RadioGroupProps;
</script>

<script lang="ts">
    let { ref = $bindable(null), value = $bindable(), ...restProps }: RadioGroupProps = $props();
</script>

<DropdownMenuPrimitive.RadioGroup bind:ref bind:value data-slot="dropdown-menu-radio-group" {...restProps} />
