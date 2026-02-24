<script module lang="ts">
    import { Dialog as DialogPrimitive } from 'bits-ui';
    import type { ClassValue } from 'clsx';
    import type { Snippet } from 'svelte';
    import type { AriaRole } from 'svelte/elements';
    import { getLocaleContext } from '@lib/i18n';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Cross from '@lib/ui/atoms/icons/common/Cross.svelte';
    import { type ButtonStyleConfig, createButtonStyle } from '@lib/ui/atoms/input/style.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import {
        type WrappedComponent,
        type WrappedSnippet,
        cn,
        isWrappedComponent,
        isWrappedSnippet
    } from '@lib/ui/utils';
    import { type LayoutWidth, colorRotation } from '.';
    import ContainerContent, { type ContainerContentProps } from './ContainerContent.svelte';
    import ContainerRoot, { type ContainerRootProps } from './ContainerRoot.svelte';

    export type DialogTriggerXProps = Omit<DialogPrimitive.TriggerProps, 'children' | 'child' | 'class'>;

    export type DialogProps = Pick<DialogPrimitive.RootProps, 'open' | 'onOpenChange' | 'onOpenChangeComplete'> &
        Pick<DialogPrimitive.PortalProps, 'to'> &
        Pick<DialogPrimitive.ContentProps, 'escapeKeydownBehavior' | 'interactOutsideBehavior' | 'onOpenAutoFocus'> &
        Pick<ContainerRootProps, 'color' | 'shadow' | 'width'> &
        Pick<ContainerContentProps, 'padding' | 'scrollShadow'> & {
            role?: AriaRole;
            trigger?: string | WrappedComponent | WrappedSnippet | Snippet<[{ class: string }]>;
            triggerStyle?: ButtonStyleConfig;
            closeIcon?: boolean | Snippet<[{ class: string }]>;
            closeIconClass?: ClassValue;
            title?: string | Snippet<[{ class: string }]>;
            titleClass?: ClassValue;
            actions?: Snippet;
            actionsClass?: ClassValue;
            children?: Snippet;
            contentClass?: ClassValue;
        };
</script>

<script lang="ts">
    let {
        to = '#popover',
        open = $bindable(false),
        onOpenChange,
        onOpenChangeComplete,
        onOpenAutoFocus,

        role = undefined,
        escapeKeydownBehavior = undefined,
        interactOutsideBehavior = undefined,

        color = undefined,
        shadow = true,
        width = 'fit',
        padding = 2,
        scrollShadow = false,

        trigger,
        triggerStyle,
        closeIcon,
        closeIconClass,
        title,
        titleClass,
        actions,
        actionsClass,
        children,
        contentClass
    }: DialogProps = $props();

    const locale = getLocaleContext();

    const headerColor = $derived(color ? `${color}-1` : colorRotation[1]);

    const alertLikeRoles = ['alertdialog'];
    const escapeKeydownBehaviorWithRole = $derived(
        escapeKeydownBehavior ?? (alertLikeRoles.includes(role ?? '') ? 'ignore' : escapeKeydownBehavior)
    );
    const interactOutsideBehaviorWithRole = $derived(
        interactOutsideBehavior ?? (alertLikeRoles.includes(role ?? '') ? 'ignore' : interactOutsideBehavior)
    );

    const widthVariants: Record<LayoutWidth, string> = {
        fit: 'max-w-full w-fit',
        sm: 'w-[60%] lg:w-[60%]',
        md: 'w-[75%] lg:w-[70%]',
        lg: 'w-[99%] lg:w-[90%]',
        full: 'w-full p-2'
    };

    const triggerStl = createButtonStyle(() => ({
        ...triggerStyle,
        useGroupFocus: typeof trigger !== 'string' && !isWrappedComponent(trigger) && !isWrappedSnippet(trigger)
    }));
    const overlayCls = $derived(
        cn(
            'fixed inset-0 z-40',
            'bg-black/50 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0'
        )
    );
    const dialogCls = $derived(
        cn(
            'z-50',
            'fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]',
            widthVariants[width],
            'focus-visible:ring-0 outline-none',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0  data-[state=closed]:zoom-out-95'
        )
    );

    const headerCls = $derived(
        cn('w-full', `bg-${headerColor} text-on-${headerColor}`, 'flex flex-row items-center justify-between', 'p-2')
    );
    const closeIconCls = $derived(
        cn(
            'flex shrink-0',
            'h-8 w-8',
            'p-1',
            'justify-end align-center',
            'hover:rounded-md hover:backdrop-brightness-highlight',
            'group-focus-visible:ring-2 group-focus-visible:ring-inset group-focus-visible:ring-on-surface',
            closeIconClass
        )
    );
    const titleCls = $derived(
        cn(
            'inline-flex shrink-0 whitespace-nowrap outline-none',
            'flex-1',
            'items-center',
            'justify-start',
            'text-start',
            titleClass
        )
    );
    const actionsCls = $derived(cn('flex flex-row flex-wrap gap-2 p-2 justify-center sm:ms-auto', actionsClass));
</script>

<DialogPrimitive.Root bind:open {onOpenChange} {onOpenChangeComplete}>
    {#if typeof trigger === 'string'}
        <DialogPrimitive.Trigger data-slot="dialog-trigger" disabled={triggerStyle?.disabled} class={triggerStl.class}>
            {trigger}
        </DialogPrimitive.Trigger>
    {:else if isWrappedComponent(trigger)}
        <DialogPrimitive.Trigger data-slot="dialog-trigger" disabled={triggerStyle?.disabled} class={triggerStl.class}>
            {@const Trigger = trigger.component}
            <Trigger />
        </DialogPrimitive.Trigger>
    {:else if isWrappedSnippet(trigger)}
        <DialogPrimitive.Trigger data-slot="dialog-trigger" disabled={triggerStyle?.disabled} class={triggerStl.class}>
            {@render trigger.snippet()}
        </DialogPrimitive.Trigger>
    {:else}
        <DialogPrimitive.Trigger
            data-slot="dialog-trigger"
            disabled={triggerStyle?.disabled}
            class="group focus-visible:ring-0 outline-none"
        >
            {@render trigger?.({ class: triggerStl.class })}
        </DialogPrimitive.Trigger>
    {/if}

    <DialogPrimitive.Portal {to}>
        <DialogPrimitive.Overlay class={overlayCls} />
        <DialogPrimitive.Content
            class={dialogCls}
            {onOpenAutoFocus}
            escapeKeydownBehavior={escapeKeydownBehaviorWithRole}
            interactOutsideBehavior={interactOutsideBehaviorWithRole}
        >
            <ContainerRoot data-slot="card" border {color} {shadow} width="full" nestingLevel={0}>
                <Stack direction="column" spacing={0}>
                    {#if title || closeIcon}
                        <div class={headerCls}>
                            <DialogPrimitive.Title>
                                {#if typeof title === 'string'}
                                    <Typography element="h1" variant="h4" class={titleCls}>{title}</Typography>
                                {:else}
                                    {@render title?.({ class: titleCls })}
                                {/if}
                            </DialogPrimitive.Title>
                            {#if closeIcon}
                                <DialogPrimitive.Close
                                    aria-label={locale.t('common.close')}
                                    class="group focus-visible:ring-0 outline-none"
                                >
                                    {#if closeIcon === true}
                                        <Cross class={closeIconCls} />
                                    {:else}
                                        {@render closeIcon({ class: closeIconCls })}
                                    {/if}
                                </DialogPrimitive.Close>
                            {/if}
                        </div>
                    {/if}

                    <ContainerContent
                        data-slot="card-content"
                        {padding}
                        {scrollShadow}
                        overflow="y"
                        class={contentClass}
                    >
                        {@render children?.()}
                    </ContainerContent>

                    {#if actions}
                        <div class={actionsCls}>
                            {@render actions()}
                        </div>
                    {/if}
                </Stack>
            </ContainerRoot>
        </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
</DialogPrimitive.Root>
