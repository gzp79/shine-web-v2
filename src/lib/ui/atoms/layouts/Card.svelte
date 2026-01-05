<script module lang="ts">
    import type { ClassValue } from 'clsx';
    import type { Snippet } from 'svelte';
    import ContainerContent, { type ContainerContentProps } from '@lib/ui/atoms/layouts/ContainerContent.svelte';
    import ContainerRoot, { type ContainerRootProps } from '@lib/ui/atoms/layouts/ContainerRoot.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import { cn } from '@lib/ui/utils';

    type RootProps = Omit<ContainerRootProps, 'ghost' | 'border' | 'overflow' | 'class' | 'children' | 'data-slot'>;
    type ContentProps = Omit<ContainerContentProps, 'class' | 'children' | 'data-slot'>;

    export type CardProps = RootProps &
        ContentProps & {
            icon?: Snippet;
            iconClass?: ClassValue | null;
            title?: Snippet;
            titleClass?: ClassValue | null;
            children: Snippet;
            contentClass?: ClassValue | null;
            actions?: Snippet;
            actionsClass?: ClassValue | null;
        };
</script>

<script lang="ts">
    let {
        color = undefined,
        shadow = false,
        width = 'fit',
        margin = undefined,
        padding = 2,
        icon = undefined,
        iconClass = undefined,
        title = undefined,
        titleClass = undefined,
        children,
        contentClass = undefined,
        actions = undefined,
        actionsClass = undefined,
        role = undefined,
        'aria-live': ariaLive = undefined
    }: CardProps = $props();

    let iconCls = $derived(
        cn(
            'flex shrink-0',
            'h-12 w-12 sm:w-12 my-2 sm:ms-2',
            'self-center sm:self-start items-center justify-center',
            iconClass
        )
    );
    let titleCls = $derived(
        cn(
            'inline-flex shrink-0 whitespace-nowrap outline-none',
            `px-2 sm:${icon && 'p-2'} gap-2`,
            'w-full',
            'items-center',
            'justify-center sm:justify-start',
            'text-center sm:text-start',
            titleClass
        )
    );
    let actionsCls = $derived(cn('flex flex-row flex-wrap gap-2 p-2 justify-center sm:ms-auto', actionsClass));
</script>

<ContainerRoot data-slot="card" border {color} {shadow} {width} {margin}>
    <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 0, sm: 2 }}
        alignment="stretch"
        {role}
        aria-live={ariaLive}
    >
        {#if icon}
            <div class={iconCls}>{@render icon()}</div>
        {/if}
        <Stack
            direction="column"
            alignment={{ xs: 'center', sm: 'start' }}
            justification="center"
            spacing={2}
            class="min-w-0 flex-1 overflow-clip"
        >
            {#if title}
                <div class={titleCls}>
                    {@render title()}
                </div>
            {/if}

            <ContainerContent data-slot="card-content" {padding} overflow="y" class={contentClass}>
                {@render children()}
            </ContainerContent>

            {#if actions}
                <div class={actionsCls}>
                    {@render actions()}
                </div>
            {/if}
        </Stack>
    </Stack>
</ContainerRoot>
