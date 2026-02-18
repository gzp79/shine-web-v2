<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect } from 'storybook/test';
    import { actionColorList, sizeList } from '@lib/ui/atoms';
    //import { inputVariantList } from '@lib/ui/atoms/input';
    import Switch from '@lib/ui/atoms/input/Switch.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import Typography from '../Typography.svelte';
    import Box from '../layouts/Box.svelte';

    const { Story } = defineMeta({
        component: Switch,
        title: 'Atoms/Inputs/Switch',
        args: {
            color: undefined,
            size: undefined,
            //variant: 'filled',
            disabled: undefined
        },
        argTypes: {
            color: {
                control: { type: 'select' },
                options: ['default', ...actionColorList],
                mapping: {
                    default: undefined
                }
            },
            size: {
                control: { type: 'select' },
                options: ['default', ...sizeList],
                mapping: {
                    default: undefined
                }
            }
            // variant: {
            //     control: { type: 'select' },
            //     options: ['default', ...inputVariantList],
            //     mapping: {
            //         default: undefined
            //     }
            // }
        },
        play: async ({ canvasElement }) => {
            expect(canvasElement).toBeDefined();
        }
    });
</script>

<Story name="Default" />

<Story name="All Colors">
    {#snippet template(args)}
        {@const { color, ...otherArgs } = args}
        <Stack>
            {#each actionColorList as color (color)}
                <Stack direction="row" alignment="center" justification="start">
                    <Typography class="w-20">{color}</Typography>
                    <Switch {...otherArgs} {color} />
                </Stack>
            {/each}
        </Stack>
    {/snippet}
</Story>

<Story name="All Sizes">
    {#snippet template(args)}
        {@const { size, ...otherArgs } = args}
        <Stack>
            {#each sizeList as size (size)}
                <Stack direction="row" alignment="center" justification="start">
                    <Typography class="w-8">{size}</Typography>
                    <Switch {...otherArgs} {size} />
                </Stack>
            {/each}
        </Stack>
    {/snippet}
</Story>

<Story name="Disabled">
    {#snippet template(args)}
        {@const { disabled, ...otherArgs } = args}
        <Stack>
            <Stack direction="row" alignment="center" justification="start">
                <Typography class="w-16">Disabled</Typography>
                <Switch {...otherArgs} disabled={true} />
            </Stack>
            <Stack direction="row" alignment="center" justification="start">
                <Typography class="w-16">Enabled</Typography>
                <Switch {...otherArgs} disabled={false} />
            </Stack>
        </Stack>
    {/snippet}
</Story>

<!-- <Story name="All Variants">
    {#snippet template(args)}
        {@const { variant, ...otherArgs } = args}
        <Stack>
            {#each inputVariantList as variant (variant)}
                <Stack direction="row" alignment="center" justification="start">
                    <Typography class="w-16">{variant}</Typography>
                    <Switch {...otherArgs} {variant} />
                </Stack>
            {/each}
        </Stack>
    {/snippet}
</Story> -->

<Story name="In Box">
    {#snippet template(args)}
        <Box border color="warning">
            <Switch {...args} />
            <Box border>
                <Switch {...args} />
                <Box border>
                    <Switch {...args} />
                    <Box border>
                        <Switch {...args} />
                        <Box border color="danger">
                            <Switch {...args} />
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    {/snippet}
</Story>
