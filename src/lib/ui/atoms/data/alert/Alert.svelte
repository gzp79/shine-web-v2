<script lang="ts" module>
    import type { ClassValue } from 'clsx';
    import type { Component, Snippet } from 'svelte';
    import type { AriaRole } from 'svelte/elements';
    import type { ActionColor, AriaLive } from '@lib/ui/atoms';
    import AlertTitle from '@lib/ui/atoms/data/alert/AlertTitle.svelte';
    import Success from '@lib/ui/atoms/icons/common/Check.svelte';
    import Fatal from '@lib/ui/atoms/icons/common/Fatal.svelte';
    import Info from '@lib/ui/atoms/icons/common/Info.svelte';
    import Warning from '@lib/ui/atoms/icons/common/Warning.svelte';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';
    import { cn } from '@lib/ui/utils';

    export const alertVariantList = ['error', 'warning', 'info', 'success'] as const;
    export type AlertVariant = (typeof alertVariantList)[number];

    export type AlertProps = {
        variant: AlertVariant;
        wide?: boolean;
        icon?: Snippet<[{ class: string }]>;
        iconClass?: ClassValue | null;
        title?: string;
        children?: Snippet;
    };
</script>

<script lang="ts">
    let { variant = 'info', wide = false, icon, iconClass, title, children }: AlertProps = $props();

    let config: {
        color: ActionColor;
        icon: Component;
        role: AriaRole;
        ariaLive: AriaLive;
    } = $derived.by(() => {
        switch (variant) {
            case 'error':
                return { color: 'danger', icon: Fatal, role: 'alert', ariaLive: 'assertive' };
            case 'warning':
                return { color: 'warning', icon: Warning, role: 'alert', ariaLive: 'polite' };
            case 'info':
                return { color: 'info', icon: Info, role: 'status', ariaLive: 'polite' };
            case 'success':
                return { color: 'success', icon: Success, role: 'status', ariaLive: 'polite' };
        }
    });

    let iconCls = $derived(cn('w-6 h-6 justify-self-center', iconClass));
    let contentCls = $derived(cn('grid grid-cols-[auto_1fr] items-center gap-x-2'));
</script>

<Box
    border
    padding={2}
    width={wide ? 'full' : 'fit'}
    color={config.color}
    role={config.role}
    aria-live={config.ariaLive}
    contentClass={contentCls}
>
    {#if icon}
        {@render icon?.({ class: iconCls })}
    {:else}
        <config.icon class={iconCls} />
    {/if}
    {#if title}
        <AlertTitle>{title}</AlertTitle>
    {/if}
    {@render children?.()}
</Box>
