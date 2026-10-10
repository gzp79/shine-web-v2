<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { sizeList } from '@lib/ui/atoms';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import LoadingCard from '@lib/ui/components/cards/LoadingCard.svelte';

    const { Story } = defineMeta({
        component: LoadingCard,
        title: 'Components/Cards/LoadingCard',
        argTypes: {
            size: {
                control: { type: 'select' },
                options: ['default', ...sizeList],
                mapping: {
                    default: undefined
                }
            }
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
