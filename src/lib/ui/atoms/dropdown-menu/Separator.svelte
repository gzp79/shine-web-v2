<script module lang="ts">
    import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
    import { cn } from '@lib/ui/utils';

    export type SeparatorProps = DropdownMenuPrimitive.SeparatorProps;
</script>

<script lang="ts">
    let { ref = $bindable(null), class: className, ...restProps }: SeparatorProps = $props();

    let cls = $derived(cn('bg-on-container -mx-1 my-1 h-px', className));
</script>

<DropdownMenuPrimitive.Separator bind:ref data-slot="dropdown-menu-separator" class={cls} {...restProps} />
