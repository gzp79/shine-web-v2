<script module lang="ts">
    import type { WithElementRef } from 'bits-ui';
    import type { HTMLAttributes } from 'svelte/elements';
    import type { ActionColor, Size } from '@lib/ui/atoms';
    import { cn, createContext } from '@lib/ui/utils';
    import type { InputVariant } from '.';

    export interface InputGroupInfo {
        color: string;
        size?: Size;
        variant?: InputVariant;
    }
    const [getInputGroupContext, setInputGroupContext] = createContext<InputGroupInfo>('InputGroup');
    export { getInputGroupContext };

    export type InputGroupProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
        color?: ActionColor;
        size?: Size;
        variant?: InputVariant;
    };
</script>

<script lang="ts">
    let {
        color,
        size,
        variant,
        class: className,
        children,
        ref = $bindable(null),
        ...restProps
    }: InputGroupProps = $props();

    const parentCtx = getInputGroupContext();
    setInputGroupContext({
        get color() {
            return color ?? parentCtx?.color ?? 'primary';
        },
        get size() {
            return size ?? parentCtx?.size ?? 'md';
        },
        get variant() {
            return variant ?? parentCtx?.variant ?? 'filled';
        }
    });

    const cls = $derived(
        cn(
            'flex w-fit items-stretch items-center',
            'has-[>[data-slot=input-group]]:gap-2',
            //"has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-e-md [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
            '[&>*:not(:first-child)]:rounded-s-none [&>*:not(:first-child)]:border-s-0 [&>*:not(:last-child)]:rounded-e-none'
        )
    );
</script>

<div bind:this={ref} role="group" data-slot="input-group" class={cls} {...restProps}>
    {@render children?.()}
</div>
