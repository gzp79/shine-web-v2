<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { actionColorList, sizeList } from '@lib/ui/atoms';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import FlagGB from '@lib/ui/atoms/glyphs/flags/gb.svelte';
    import Spinner from '@lib/ui/atoms/icons/animated/Spinner.svelte';
    import Settings from '@lib/ui/atoms/icons/common/Settings.svelte';
    import { inputVariantList } from '@lib/ui/atoms/input';
    import Button, { type ButtonProps } from '@lib/ui/atoms/input/Button.svelte';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';

    const { Story } = defineMeta({
        component: Button,
        title: 'Atoms/Inputs/Button',
        args: {
            color: undefined,
            size: undefined,
            variant: 'filled',
            wide: undefined,
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
            },
            variant: {
                control: { type: 'select' },
                options: ['default', ...inputVariantList],
                mapping: {
                    default: undefined
                }
            }
        }
    });

    const href = 'https://example.com';
</script>

<Story name="Default Action">Click Me</Story>

<Story name="Default Link" args={{ href }}>Click Me</Story>

{#snippet buttonSet(args: ButtonProps)}
    <Stack direction="row" alignment="center" justification="start" wrap margin={2}>
        <Button {...args}><Settings /></Button>
        <Button {...args}>Click Me</Button>
        <Button {...args}>Loading... <Spinner /></Button>
        <Button {...args}><FlagGB />English</Button>
    </Stack>
{/snippet}

<Story name="Disabled Action">
    {#snippet template(args)}
        <Stack>
            {@render buttonSet({ ...args, disabled: true })}
        </Stack>
    {/snippet}
</Story>

<Story name="Disabled Link" args={{ href }}>
    {#snippet template(args)}
        <Stack>
            {@render buttonSet({ ...args, disabled: true })}
        </Stack>
    {/snippet}
</Story>

<Story name="All Colors">
    {#snippet template(args)}
        {@const { color, ...otherArgs } = args}
        <Stack>
            {#each actionColorList as color (color)}
                <Stack direction="row" alignment="center" justification="start">
                    <Typography class="w-20">{color}</Typography>
                    {@render buttonSet({ ...otherArgs, color })}
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
                    {@render buttonSet({ ...otherArgs, size })}
                </Stack>
            {/each}
        </Stack>
    {/snippet}
</Story>

<Story name="All Variants">
    {#snippet template(args)}
        {@const { variant, ...otherArgs } = args}
        <Stack>
            {#each inputVariantList as variant (variant)}
                <Stack direction="row" alignment="center" justification="start">
                    <Typography class="w-16">{variant}</Typography>
                    {@render buttonSet({ ...otherArgs, variant })}
                </Stack>
            {/each}
        </Stack>
    {/snippet}
</Story>

<Story name="In Box">
    {#snippet template(args)}
        <Box border color="warning">
            {@render buttonSet(args)}
            <Box border>
                {@render buttonSet(args)}
                <Box border>
                    {@render buttonSet(args)}
                    <Box border>
                        {@render buttonSet(args)}
                        <Box border color="danger">
                            {@render buttonSet(args)}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    {/snippet}
</Story>
