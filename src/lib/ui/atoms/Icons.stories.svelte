<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect } from 'storybook/test';
    import { actionColorList, iconSizeList } from '@lib/ui/atoms';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import IconBase, { type IconBaseProps, type IconSet } from '@lib/ui/atoms/icons/IconBase.svelte';
    import animatedIcons from '@lib/ui/atoms/icons/animated/all';
    import commonIcons from '@lib/ui/atoms/icons/common/all';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';
    import Stack from './layouts/Stack.svelte';

    const { Story } = defineMeta({
        title: 'Atoms/Theme/Icons',
        component: IconBase,
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
            },
            color: {
                control: 'select',
                options: ['default', ...actionColorList],
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

{#snippet iconGrid(args: IconBaseProps, icons: IconSet)}
    {@const { size, color, disabled } = args}
    <div class="flex flex-wrap justify-center gap-2">
        {#each Object.entries(icons) as [name, IconComponent] (name)}
            <Box
                {color}
                border
                contentClass="flex flex-col items-center justify-center border p-4 max-h-64 has-[svg.h-full]:h-64"
            >
                <IconComponent {disabled} {size} />
                <Typography variant="h6">{name}</Typography>
            </Box>
        {/each}
    </div>
{/snippet}

<Story name="Common">
    {#snippet template(args)}
        {@render iconGrid(args, commonIcons)}
    {/snippet}
</Story>

<Story name="Animated">
    {#snippet template(args)}
        {@render iconGrid(args, animatedIcons)}
    {/snippet}
</Story>
