<script module lang="ts">
    import type { ButtonRootProps } from 'bits-ui';
    import { Button } from 'bits-ui';
    import type { ClassValue } from 'clsx';
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
    export type ButtonProps = Omit<ButtonRootProps, 'class'> &
        ButtonAction &
        ButtonStyleConfig & {
            class?: ClassValue;
        };
</script>

<script lang="ts">
    let {
        color,
        variant,
        size,
        wide,
        disabled,
        class: className,
        children,
        ref = $bindable(null),
        ...restProps
    }: ButtonProps = $props();

    const buttonStl = createButtonStyle(() => ({
        color,
        variant,
        size,
        wide,
        disabled,
        class: className
    }));

    const linkSvelteControls = (href: string) => {
        if (href.startsWith('/api/') || href.startsWith('http://') || href.startsWith('https://')) {
            return {
                // bypass svelte-kit routing and disable preloading
                'data-sveltekit-reload': true,
                'data-sveltekit-preload-data': 'off'
            };
        }

        return {};
    };

    const svelteCtrl = $derived(restProps.href ? linkSvelteControls(restProps.href) : {});
</script>

<Button.Root bind:ref disabled={buttonStl.disabled} class={buttonStl.class} {...svelteCtrl} {...restProps}>
    {@render children?.()}
</Button.Root>
