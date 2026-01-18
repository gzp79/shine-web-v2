<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect, fn, waitFor, within } from 'storybook/test';
    import { actionColorList, sizeList } from '@lib/ui/atoms';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import FlagGB from '@lib/ui/atoms/glyphs/flags/gb.svelte';
    import Spinner from '@lib/ui/atoms/icons/animated/Spinner.svelte';
    import Settings from '@lib/ui/atoms/icons/common/Settings.svelte';
    import { inputVariantList } from '@lib/ui/atoms/input';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import InputGroup from '@lib/ui/atoms/input/InputGroup.svelte';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import ConfirmationButton, { type ConfirmationButtonProps } from '@lib/ui/components/ConfirmationButton.svelte';

    const { Story } = defineMeta({
        title: 'Components/ConfirmationButton',
        component: ConfirmationButton,
        args: {
            confirmation: {
                trigger: 'Open Dialog',
                title: 'Confirm Action',
                question: 'Are you sure you want to proceed?',
                confirm: 'Yes',
                cancel: 'No',
                preventClose: undefined
            }
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

<script lang="ts">
</script>

<Story name="Default">This is a button</Story>

{#snippet buttonSet(args: ConfirmationButtonProps)}
    <Stack direction="row" alignment="center" justification="start" wrap margin={2}>
        <ConfirmationButton {...args}><Settings /></ConfirmationButton>
        <ConfirmationButton {...args}>Click Me</ConfirmationButton>
        <ConfirmationButton {...args}>Loading... <Spinner /></ConfirmationButton>
        <ConfirmationButton {...args}><FlagGB />English</ConfirmationButton>
    </Stack>
{/snippet}

<!-- <Story
    name="Disabled Action"
    args={{ onChclick: fn() }}
    play={async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);

        const btns = await canvas.getAllByRole('button');
        expect(btns.length).toBe(4);
        for (const btn of btns) {
            expect(btn).toBeDisabled();
            await btn.click();
        }
        expect(args.onclick).toHaveBeenCalledTimes(0);
    }}
>
    {#snippet template(args)}
        <Stack>
            {@render buttonSet({ ...args, disabled: true })}
        </Stack>
    {/snippet}
</Story> -->

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

<Story name="In InputGroup">
    {#snippet template(args)}
        {@const { children, color, variant, size, ...otherArgs } = args}
        <InputGroup {color} {variant} {size}>
            <Button>Left</Button>
            <ConfirmationButton {...otherArgs}>Confirm</ConfirmationButton>
            <Button>Right</Button>
        </InputGroup>
    {/snippet}
</Story>
