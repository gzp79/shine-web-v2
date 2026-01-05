<script module lang="ts">
    import MarginDecorator from '@sb/MarginDecorator.svelte';
    import { lorem } from '@sb/lorem';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect } from 'storybook/test';
    import { actionColorList, spacingList } from '@lib/ui/atoms';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import { widthList } from '@lib/ui/atoms/layouts';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';

    const { Story } = defineMeta({
        component: Box,
        title: 'Atoms/Layouts/Box',
        args: {},
        argTypes: {
            color: {
                control: { type: 'select' },
                options: ['default', ...actionColorList],
                mapping: {
                    default: undefined
                }
            },
            width: {
                control: { type: 'select' },
                options: ['default', ...widthList],
                mapping: {
                    default: undefined
                }
            },
            margin: {
                control: { type: 'select' },
                options: ['default', ...spacingList.map((s) => ` ${s}`)],
                mapping: {
                    ...spacingList.reduce(
                        (acc, s) => {
                            acc[` ${s}`] = s;
                            return acc;
                        },
                        {} as Record<string, number>
                    ),
                    default: undefined
                }
            },
            padding: {
                control: { type: 'select' },
                options: ['default', ...spacingList.map((s) => ` ${s}`)],
                mapping: {
                    ...spacingList.reduce(
                        (acc, s) => {
                            acc[` ${s}`] = s;
                            return acc;
                        },
                        {} as Record<string, number>
                    ),
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

<Story name="Default">content</Story>

<Story name="Color Variants">
    {#snippet template(args)}
        {@const { children, color, ...otherArgs } = args}
        <Stack>
            {#each actionColorList as colorValue (colorValue)}
                <Box {...otherArgs} color={colorValue}>
                    <Typography variant="text">{colorValue} variant</Typography>
                </Box>
            {/each}
        </Stack>
    {/snippet}
</Story>

<Story name="With Border">
    {#snippet template(args)}
        {@const { children, border, ...otherArgs } = args}
        <Stack>
            <Box {...otherArgs} border>
                <Typography variant="text">Box with border</Typography>
            </Box>
            <Box {...otherArgs} border color="primary">
                <Typography variant="text">Primary box with border</Typography>
            </Box>
            <Box {...otherArgs} border color="danger">
                <Typography variant="text">Danger box with border</Typography>
            </Box>
        </Stack>
    {/snippet}
</Story>

<Story name="With Shadow">
    {#snippet template(args)}
        {@const { children, shadow, ...otherArgs } = args}
        <Stack>
            <Box {...otherArgs} shadow>
                <Typography variant="text">Box with shadow</Typography>
            </Box>
            <Box {...otherArgs} border shadow color="info">
                <Typography variant="text">Info box with border and shadow</Typography>
            </Box>
        </Stack>
    {/snippet}
</Story>

<Story name="Ghost Mode">
    {#snippet template(args)}
        {@const { children, ghost, ...otherArgs } = args}
        <Box>
            <Stack>
                <Box {...otherArgs} ghost>
                    <Typography variant="text">Ghost box</Typography>
                </Box>
                <Box {...otherArgs} ghost={false}>
                    <Typography variant="text">Non ghost box</Typography>
                </Box>
            </Stack>
        </Box>
    {/snippet}
</Story>

<Story name="Nesting">
    {#snippet template(args)}
        {@const { children, ...otherArgs } = args}
        <Box border>
            <Typography variant="text">First level</Typography>
            <Box {...otherArgs}>
                <Typography variant="text">Second level - updated from controls</Typography>
                <Box border>
                    <Typography variant="text">Third level</Typography>
                    <Box {...otherArgs}>
                        <Typography variant="text">Fourth level - updated from controls</Typography>
                        <Box border>
                            <Typography variant="text">Fifth level</Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    {/snippet}
</Story>

<Story name="Overflow">
    {#snippet template(args)}
        {@const { children, overflow, ...otherArgs } = args}
        <Stack>
            <Box {...otherArgs} border overflow="y" contentClass="max-h-32 max-w-64">
                <Typography>Vertical Scroll (y)</Typography>
                <Typography variant="text" class="min-w-96">{lorem.long}</Typography>
            </Box>
            <Box {...otherArgs} border overflow="x" contentClass="max-h-32 max-w-64">
                <Typography>Horizontal Scroll (x)</Typography>
                <Typography variant="text" class="min-w-96">{lorem.long}</Typography>
            </Box>
            <Box {...otherArgs} border overflow="xy" contentClass="max-h-32 max-w-64">
                <Typography>Auto Overflow (xy)</Typography>
                <Typography variant="text" class="min-w-96">{lorem.long}</Typography>
            </Box>
            <Box {...otherArgs} border overflow="hidden" contentClass="max-h-32 max-w-64">
                <Typography>Hidden Overflow</Typography>
                <Typography variant="text" class="min-w-96">{lorem.long}</Typography>
            </Box>
        </Stack>
    {/snippet}
</Story>
