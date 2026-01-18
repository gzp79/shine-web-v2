<script module lang="ts">
    import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
    import { cn } from '@lib/ui/utils';

    export type HeadingProps = DropdownMenuPrimitive.GroupHeadingProps;
</script>

<script lang="ts">
    let { ref = $bindable(null), class: className, ...restProps }: HeadingProps = $props();

    const cls = $derived(cn('px-2 py-1.5 text-sm font-semibold', className));
</script>

<DropdownMenuPrimitive.GroupHeading bind:ref data-slot="dropdown-menu-heading" class={cls} {...restProps} />
