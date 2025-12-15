<script module lang="ts">
    import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
    import { cn } from '@lib/ui/utils';

    export type ItemProps = DropdownMenuPrimitive.ItemProps & {
        dangerous?: boolean;
    };
</script>

<script lang="ts">
    let { ref = $bindable(null), class: className, dangerous = false, ...restProps }: ItemProps = $props();

    let cls = $derived(
        cn(
            'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
            'data-highlighted:bg-sub-container data-highlighted:text-on-sub-container',
            'data-disabled:!opacity-30 data-disabled:!cursor-not-allowed',
            dangerous && [
                'bg-danger text-on-danger', //
                'data-highlighted:bg-danger-1 data-highlighted:text-on-danger'
            ],
            className
        )
    );
</script>

<DropdownMenuPrimitive.Item bind:ref data-slot="dropdown-menu-item" class={cls} {...restProps} />
