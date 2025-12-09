<script module lang="ts">
    import type { Snippet } from 'svelte';
    import type { ClassValue } from 'svelte/elements';
    import ContainerContent, { type ContainerContentBaseProps } from '@lib/ui/atoms/layouts/ContainerContent.svelte';
    import ContainerRoot, { type ContainerRootBaseProps } from '@lib/ui/atoms/layouts/ContainerRoot.svelte';

    export type BoxProps = ContainerRootBaseProps &
        ContainerContentBaseProps & {
            contentClass?: ClassValue | null;
            children: Snippet;
        };
</script>

<script lang="ts">
    let {
        color = undefined,
        border = true,
        shadow = true,
        ghost = false,
        width = 'fit',
        margin = undefined,
        padding = 4,
        overflow = 'xy',

        contentClass = undefined,

        children
    }: BoxProps = $props();
</script>

<ContainerRoot dataSlot="box" {color} {border} {shadow} {ghost} {width} {margin}>
    <ContainerContent dataSlot="box-content" {padding} {overflow} class={contentClass}>
        {@render children()}
    </ContainerContent>
</ContainerRoot>
