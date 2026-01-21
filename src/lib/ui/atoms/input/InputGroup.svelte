<script module lang="ts">
    import type { WithElementRef } from 'bits-ui';
    import type { ClassValue } from 'clsx';
    import type { HTMLAttributes } from 'svelte/elements';
    import type { ActionColor, Size } from '@lib/ui/atoms';
    import { cn, createContext } from '@lib/ui/utils';
    import type { InputVariant } from '.';

    // For overlapping borders browser add some "antialiasing" scale, so we need to compensate it
    // Using empirical value here, but this could be browser dependent
    export const marginClass = '-ms-[1.6px]';

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
        class?: ClassValue;
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
            //"has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-e-md [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit",
            '[&>input]:flex-1',
            '[&>*:hover]:z-10 [&>*:focus-visible]:z-10',
            `[&>*:not(:first-child)]:rounded-s-none [&>*:not(:first-child)]:${marginClass} [&>*:not(:last-child)]:rounded-e-none`,
            className
        )
    );
</script>

<div bind:this={ref} role="group" data-slot="input-group" class={cls} {...restProps}>
    {@render children?.()}
</div>
