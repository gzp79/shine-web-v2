<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect, within } from 'storybook/test';
    import { actionColorList, sizeList } from '@lib/ui/atoms';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import { inputVariantList } from '@lib/ui/atoms/input';
    import Input, { type InputProps, inputTypeList } from '@lib/ui/atoms/input/Input.svelte';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';

    const { Story } = defineMeta({
        component: Input,
        title: 'Atoms/Inputs/Input',
        args: {
            color: undefined,
            size: undefined,
            variant: 'filled',
            wide: undefined,
            disabled: undefined,
            invalid: undefined
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
            },
            type: {
                control: { type: 'select' },
                options: ['default', ...inputTypeList],
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

<script lang="ts">
    import { tick } from 'svelte';
    import { t } from '@lib/i18n/i18n.svelte';

    let value = $state();
</script>

<Story name="Default" args={{ placeholder: 'Enter text' }}></Story>

<Story
    name="Value binding"
    play={async ({ canvasElement, userEvent }) => {
        const canvas = within(canvasElement);
        const input = await canvas.getByRole('textbox');
        await userEvent.type(input, 'Hello World');
        await expect(input).toHaveValue('Hello World');
        expect(value).toBe('Hello World');

        value = 'Another Value';
        await tick();
        await expect(input).toHaveValue('Another Value');
    }}
>
    {#snippet template(args)}
        <Stack>
            <Typography class="whitespace-nowrap">value: [{value}]</Typography>
            <Input {...args} bind:value />
        </Stack>
    {/snippet}
</Story>

{#snippet inputSet(args: InputProps)}
    <Stack direction="row" alignment="center" justification="start" wrap margin={2}>
        {@const { type, placeholder, ...otherArgs } = args}
        <Input placeholder="Text" type="text" {...otherArgs} />
        <Input placeholder="Password" type="password" {...otherArgs} />
        <Input placeholder="Number" type="number" {...otherArgs} />
    </Stack>
{/snippet}

<Story name="All Types">
    {#snippet template(args)}
        {@const { type, ...otherArgs } = args}
        <Stack>
            {#each inputTypeList as type (type)}
                <Stack direction="row" alignment="center" justification="start">
                    <Typography class="w-24">{type}</Typography>
                    <Input {...otherArgs} {type} />
                </Stack>
            {/each}
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
                    {@render inputSet({ ...otherArgs, color })}
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
                    {@render inputSet({ ...otherArgs, size })}
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
                    {@render inputSet({ ...otherArgs, variant })}
                </Stack>
            {/each}
        </Stack>
    {/snippet}
</Story>

<Story name="In Box">
    {#snippet template(args)}
        <Box border color="warning">
            {@render inputSet(args)}
            <Box border>
                {@render inputSet(args)}
                <Box border>
                    {@render inputSet(args)}
                    <Box border>
                        {@render inputSet(args)}
                        <Box border color="danger">
                            {@render inputSet(args)}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    {/snippet}
</Story>
