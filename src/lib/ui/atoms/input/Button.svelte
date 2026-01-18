<script module lang="ts">
    import type { ButtonRootProps } from 'bits-ui';
    import { Button } from 'bits-ui';
    import { type ButtonStyleConfig, createButtonStyle } from '@lib/ui/atoms/input/button-style.svelte';

    export type ButtonProps = ButtonRootProps & ButtonStyleConfig;
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

<Button.Root {disabled} class={buttonStl.class} {...restProps}>
    {@render children?.()}
</Button.Root>
