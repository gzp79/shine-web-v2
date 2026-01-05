<script module lang="ts">
    import MarginDecorator from '@sb/MarginDecorator.svelte';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect } from 'storybook/test';
    import type { Component } from 'svelte';
    import Stack from '@lib/ui//atoms/layouts/Stack.svelte';
    import { sizeList } from '@lib/ui/atoms';
    import LoadingCard, { type LoadingProps } from '@lib/ui/components/LoadingCard.svelte';

    const { Story } = defineMeta<unknown, Component<LoadingProps>>({
        component: LoadingCard,
        title: 'Components/Status/Loading',
        args: {},
        argTypes: {
            size: {
                control: { type: 'select' },
                options: ['default', ...sizeList],
                mapping: {
                    default: undefined
                }
            }
        },
        // Ignore https://github.com/storybookjs/storybook/issues/29951
        // @ts-expect-error Bug in Storybook
        decorators: [() => MarginDecorator],
        play: async ({ canvasElement }) => {
            expect(canvasElement).toBeDefined();
        }
    });
</script>

<Story name="Default" />

<Story name="Size Variants">
    {#snippet template(args)}
        {@const { size, ...otherArgs } = args}
        <Stack spacing={4} margin={4}>
            {#each sizeList as sizeValue (sizeValue)}
                <LoadingCard {...otherArgs} size={sizeValue} />
            {/each}
        </Stack>
    {/snippet}
</Story>
