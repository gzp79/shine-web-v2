<script module lang="ts">
    import DropdownIcon from '@lib/ui/atoms/icons/common/Dropdown.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import InputGroup, { type InputGroupProps } from '@lib/ui/atoms/input/InputGroup.svelte';
    import { cn } from '@lib/ui/utils';

    export type ComboButtonProps = Omit<InputGroupProps, 'data-slot' | 'children'>;
</script>

<script lang="ts">
    let { ...restProps }: ComboButtonProps = $props();

    // Classes for buttons to remove outer rounding when ComboButton is inside InputGroup
    const firstButtonCls = $derived(cn('[*:not(:first-child)>&]:rounded-s-none [*:not(:first-child)>&]:border-s-0'));
    const lastButtonCls = $derived(cn('[*:not(:last-child)>&]:rounded-e-none'));
</script>

<InputGroup data-slot="combo-button" {...restProps}>
    <Button class={firstButtonCls}>Action</Button>
    <Button class={lastButtonCls}><DropdownIcon /></Button>
</InputGroup>
