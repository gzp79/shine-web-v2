<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect } from 'storybook/test';
    import { actionColorList, sizeList } from '@lib/ui/atoms';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import DropdownIcon from '@lib/ui/atoms/icons/common/Dropdown.svelte';
    import { inputVariantList } from '@lib/ui/atoms/input';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Input from '@lib/ui/atoms/input/Input.svelte';
    import InputGroup, { type InputGroupProps } from '@lib/ui/atoms/input/InputGroup.svelte';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';

    const { Story } = defineMeta({
        component: InputGroup,
        title: 'Atoms/Inputs/InputGroup',
        args: {
            color: undefined,
            size: undefined,
            variant: 'filled'
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
        },
        play: async ({ canvasElement }) => {
            expect(canvasElement).toBeDefined();
        }
    });
</script>

<Story name="Some buttons">
    {#snippet template(args)}
        {@const { children, ...otherArgs } = args}
        <InputGroup {...otherArgs}>
            <Button>Left</Button>
            <Button>Middle</Button>
            <Button>Right</Button>
        </InputGroup>
    {/snippet}
</Story>

<Story name="Combo button">
    {#snippet template(args)}
        {@const { children, ...otherArgs } = args}
        <InputGroup {...otherArgs}>
            <Button wide>Selected</Button>
            <Button><DropdownIcon /></Button>
        </InputGroup>
    {/snippet}
</Story>

<Story name="Input text">
    {#snippet template(args)}
        {@const { children, ...otherArgs } = args}
        <InputGroup {...otherArgs}>
            <Button>Left</Button>
            <Input type="text" placeholder="Enter text" />
            <Button>Right</Button>
        </InputGroup>
    {/snippet}
</Story>

<Story name="Input text with invalid state">
    {#snippet template(args)}
        {@const { children, ...otherArgs } = args}
        <InputGroup {...otherArgs}>
            <Button>Left</Button>
            <Input type="text" placeholder="Enter text" invalid />
            <Button>Right</Button>
        </InputGroup>
    {/snippet}
</Story>

<Story name="Nested InputGroup">
    {#snippet template(args)}
        {@const { children, ...otherArgs } = args}
        <InputGroup {...otherArgs}>
            <InputGroup color="secondary">
                <Button>?</Button>
            </InputGroup>
            <InputGroup size="xs" color="warning" variant="outline">
                <Button>Left</Button>
                <Button color="danger">Middle</Button>
                <Button>Right</Button>
            </InputGroup>
            <InputGroup>
                <Input type="text" placeholder="Enter text" invalid />
                <Button>Search</Button>
            </InputGroup>
        </InputGroup>
    {/snippet}
</Story>

{#snippet inputSet(args: InputGroupProps)}
    <InputGroup {...args}>
        <Button>Left</Button>
        <Input type="text" placeholder="Enter text" />
        <Button><DropdownIcon /></Button>
        <Button>Right</Button>
    </InputGroup>
{/snippet}

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
        {@const { children, ...otherArgs } = { ...args, class: 'my-2' }}
        <Box border color="warning">
            {@render inputSet(otherArgs)}
            <Box border>
                {@render inputSet(otherArgs)}
                <Box border>
                    {@render inputSet(otherArgs)}
                    <Box border>
                        {@render inputSet(otherArgs)}
                        <Box border color="danger">
                            {@render inputSet(otherArgs)}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    {/snippet}
</Story>
