<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect, fn, within } from 'storybook/test';
    import { actionColorList, sizeList } from '@lib/ui/atoms';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import FlagGB from '@lib/ui/atoms/glyphs/flags/gb.svelte';
    import Spinner from '@lib/ui/atoms/icons/animated/Spinner.svelte';
    import Settings from '@lib/ui/atoms/icons/common/Settings.svelte';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import { inputVariantList } from '@lib/ui/input';
    import Button, { type ButtonProps } from '@lib/ui/input/Button.svelte';

    const { Story } = defineMeta({
        component: Button,
        title: 'Atoms/Inputs/Button',
        args: {
            color: 'default',
            size: 'md',
            variant: 'filled',
            wide: undefined,
            disabled: undefined,
            highlight: undefined
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

    const href = 'https://example.com';
</script>

<Story
    name="Default Action"
    args={{ onclick: fn() }}
    play={async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const button = await canvas.getByRole('button');
        await button.click();
        expect(args.onclick).toHaveBeenCalled();
    }}
>
    Click Me
</Story>

<Story
    name="Default Link"
    args={{ href }}
    play={async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        const link = await canvas.getByRole('link');
        expect(link).toHaveAttribute('href', args.href);
    }}
>
    Click Me
</Story>

{#snippet buttonSet(args: ButtonProps)}
    <Stack direction="row" alignment="center" justification="start" wrap margin={2}>
        <Button {...args}><Settings /></Button>
        <Button {...args}>Click Me</Button>
        <Button {...args}>Loading... <Spinner /></Button>
        <Button {...args}><FlagGB />English</Button>
    </Stack>
{/snippet}

<Story
    name="Disabled Action"
    args={{ onclick: fn() }}
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
</Story>

<Story
    name="Disabled Link"
    args={{ href }}
    play={async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);

        const links = await canvas.getAllByRole('link');
        expect(links.length).toBe(4);
        for (const link of links) {
            expect(link).toHaveAttribute('aria-disabled', 'true');
            expect(link).not.toHaveAttribute('href');
        }
    }}
>
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
