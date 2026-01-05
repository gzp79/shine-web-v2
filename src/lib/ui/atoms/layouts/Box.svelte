<script module lang="ts">
    import type { Snippet } from 'svelte';
    import type { ClassValue } from 'svelte/elements';
    import ContainerContent, { type ContainerContentProps } from '@lib/ui/atoms/layouts/ContainerContent.svelte';
    import ContainerRoot, { type ContainerRootProps } from '@lib/ui/atoms/layouts/ContainerRoot.svelte';

    type RootProps = Omit<ContainerRootProps, 'class' | 'children' | 'data-slot'>;
    type ContentProps = Omit<ContainerContentProps, 'class' | 'children' | 'data-slot'>;

    export type BoxProps = RootProps &
        ContentProps & {
            containerClass?: ClassValue | null;
            contentClass?: ClassValue | null;
            children: Snippet;
        };
</script>

<script lang="ts">
    let {
        color = undefined,
        border = true,
        shadow = false,
        ghost = false,
        width = 'fit',
        margin = undefined,
        padding = 4,
        overflow = 'xy',

        containerClass = undefined,
        contentClass = undefined,

        children,

        ...contentRest
    }: BoxProps = $props();
</script>

<ContainerRoot data-slot="box" {color} {border} {shadow} {ghost} {width} {margin} class={containerClass}>
    <ContainerContent data-slot="box-content" {padding} {overflow} class={contentClass} {...contentRest}>
        {@render children()}
    </ContainerContent>
</ContainerRoot>
