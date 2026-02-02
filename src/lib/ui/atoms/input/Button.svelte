<script module lang="ts">
    import type { ButtonRootProps } from 'bits-ui';
    import { Button } from 'bits-ui';
    import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
    import { type ButtonStyleConfig, createButtonStyle } from '@lib/ui/atoms/input/style.svelte';

    export type LinkAction = {
        href: HTMLAnchorAttributes['href'];
        type?: never;
        disabled?: HTMLButtonAttributes['disabled'];
    };
    export type NativeButtonAction = {
        type?: HTMLButtonAttributes['type'];
        href?: never;
        disabled?: HTMLButtonAttributes['disabled'];
        onclick?: HTMLButtonAttributes['onclick'];
    };
    export type ButtonAction = LinkAction | NativeButtonAction;
    export type ButtonProps = ButtonRootProps & ButtonAction & ButtonStyleConfig;
</script>

<script lang="ts">
    let { color, variant, size, wide, disabled, class: className, children, ...restProps }: ButtonProps = $props();

    const buttonStl = createButtonStyle(() => ({
        color,
        variant,
        size,
        wide,
        disabled,
        class: className
    }));
</script>

<Button.Root disabled={buttonStl.disabled} class={buttonStl.class} {...restProps}>
    {@render children?.()}
</Button.Root>
