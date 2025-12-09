<script context="module" lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect } from 'storybook/test';
    import { iconSizeList } from '@lib/ui/atoms';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import GlyphBase, { type GlyphBaseProps, type GlyphSet } from '@lib/ui/atoms/glyphs/GlyphBase.svelte';
    import brandIcons from '@lib/ui/atoms/glyphs/brands/all';
    import flagIcons from '@lib/ui/atoms/glyphs/flags/all';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';

    const { Story } = defineMeta({
        title: 'Atoms/Theme/Glyphs',
        component: GlyphBase,
        args: {
            size: 'md'
        },
        argTypes: {
            size: {
                control: { type: 'select' },
                options: ['default', ...iconSizeList],
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

{#snippet glyphGrid(args: GlyphBaseProps, glyphs: GlyphSet)}
    {@const { size, disabled } = args}
    <div class="flex flex-wrap justify-center gap-2">
        {#each Object.entries(glyphs) as [name, GlyphComponent] (name)}
            <Box
                border
                contentClass="flex flex-col items-center justify-center border p-4 max-h-64 has-[svg.h-full]:h-64"
            >
                <GlyphComponent {disabled} {size} />
                <Typography variant="h6">{name}</Typography>
            </Box>
        {/each}
    </div>
{/snippet}

<Story name="Flags">
    {#snippet template(args)}
        {@render glyphGrid(args, flagIcons)}
    {/snippet}
</Story>

<Story name="Brands">
    {#snippet template(args)}
        {@render glyphGrid(args, brandIcons)}
    {/snippet}
</Story>
