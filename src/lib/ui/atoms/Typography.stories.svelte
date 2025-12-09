<script context="module" lang="ts">
    import { lorem } from '@sb/lorem';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect, within } from 'storybook/test';
    import Typography, { variantList, weightList } from '@lib/ui/atoms/Typography.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';

    const { Story } = defineMeta({
        component: Typography,
        title: 'Atoms/Theme/Typography',
        args: {},
        argTypes: {
            variant: {
                control: { type: 'select' },
                options: ['default', ...variantList],
                mapping: {
                    default: undefined
                }
            },
            weight: {
                control: { type: 'select' },
                options: ['default', ...weightList],
                mapping: {
                    default: undefined
                }
            }
        },
        play: async ({ canvasElement }) => {
            expect(canvasElement).toBeDefined();
        }
    });
</script>

<Story name="Default">The quick brown fox</Story>

<Story
    name="All Variants"
    play={async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        for (const variant of variantList) {
            const element = await canvas.getByText(new RegExp(variant, 'i'));
            expect(element).toBeInTheDocument();
        }
    }}
>
    {#snippet template(args)}
        {@const { variant, children, ...otherArgs } = args}
        <Stack>
            {#each variantList as variant (variant)}
                <Typography {...otherArgs} {variant}>{variant} - The quick brown fox</Typography>
            {/each}
        </Stack>
    {/snippet}
</Story>

<Story name="All Weights">
    {#snippet template(args)}
        {@const { weight, children, ...otherArgs } = args}
        <Stack>
            <Typography {...otherArgs} weight="normal">Normal Weight Heading</Typography>
            <Typography {...otherArgs} weight="emphasis">Emphasis Weight Heading</Typography>
            <Typography {...otherArgs} weight="bold">Bold Weight Heading</Typography>
        </Stack>
    {/snippet}
</Story>

<Story name="Headings Hierarchy" asChild>
    <Stack>
        <Typography variant="h1">Chapter Title (H1)</Typography>
        <Typography variant="text">Introduction paragraph with regular text explaining the chapter content.</Typography>

        <Typography variant="h2">Section Title (H2)</Typography>
        <Typography variant="text">Section content with more detailed information about the topic.</Typography>

        <Typography variant="h3">Subsection Title (H3)</Typography>
        <Typography variant="text">Subsection content breaking down the information further.</Typography>

        <Typography variant="h4">Detail Title (H4)</Typography>
        <Typography variant="text">Detailed information about a specific aspect.</Typography>
    </Stack>
</Story>

<Story name="Custom Element" asChild>
    <Stack>
        <Typography variant="h3" element="div">Div element styles as H3 (for semantic purposes)</Typography>
        <Typography variant="text" element="span">Span element styled as text</Typography>
    </Stack>
</Story>

<Story name="Long Text Wrapping" asChild>
    <Stack>
        <Typography variant="h2">
            This is a very long heading that demonstrates text wrapping behavior when the content exceeds the available
            width of the container
        </Typography>
        <Typography variant="text">
            {lorem.long}
        </Typography>
    </Stack>
</Story>
