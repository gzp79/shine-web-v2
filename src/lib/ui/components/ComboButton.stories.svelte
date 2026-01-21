<script module lang="ts">
    import { withinPopover } from '@sb/models/popover';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { action } from 'storybook/actions';
    import { expect, fn, waitFor, within } from 'storybook/test';
    import { actionColorList, sizeList } from '@lib/ui/atoms';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import { inputVariantList } from '@lib/ui/atoms/input';
    import Button, { type NativeButtonAction } from '@lib/ui/atoms/input/Button.svelte';
    import InputGroup from '@lib/ui/atoms/input/InputGroup.svelte';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import ComboButton, { type ComboButtonProps } from '@lib/ui/components/ComboButton.svelte';

    const { Story } = defineMeta({
        title: 'Components/ComboButton',
        component: ComboButton,
        args: {
            options: [{ caption: 'Option 1' }, { caption: 'Option 2' }, { caption: 'Option 3' }],
            current: 0
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

<Story
    name="Default"
    args={{
        options: [
            { caption: 'Option 1', onclick: fn(action('Option 1 click')) },
            { caption: 'Option 2', onclick: fn(action('Option 2 click')) },
            { caption: 'Option 3', onclick: fn(action('Option 3 click')) }
        ]
    }}
    play={async ({ canvasElement, args, step }) => {
        const canvas = within(canvasElement);

        // click menu button
        const btns = await canvas.getAllByRole('button');
        btns[1].click();

        // click option 2
        const menu = await waitFor(async () => {
            const portalCanvas = withinPopover();
            const menu = (await portalCanvas.getByRole('menu')) as HTMLElement;
            expect(menu).toBeVisible();
            return menu;
        });
        const option = within(menu).getAllByRole('menuitem', { name: /option 2/i });
        await option[0].click();
        waitFor(async () => {
            expect(menu).not.toBeVisible();
        });

        // click action button
        await expect(btns[0]).toHaveTextContent('Option 2');
        btns[0].click();
        expect((args.options[0] as NativeButtonAction).onclick).toHaveBeenCalledTimes(0);
        expect((args.options[1] as NativeButtonAction).onclick).toHaveBeenCalledTimes(1);
        expect((args.options[2] as NativeButtonAction).onclick).toHaveBeenCalledTimes(0);
    }}
/>

{#snippet buttonSet(args: ComboButtonProps)}
    <Stack direction="row" alignment="center" justification="start" wrap margin={2}>
        <ComboButton {...args} />
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

<Story
    name="Mixed action and href"
    args={{
        options: [
            { caption: 'click', onclick: action('click') },
            { caption: 'href', href: 'https://example.com' },
            { caption: 'none' }
        ]
    }}
/>

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
        {@const { color, variant, size, ...otherArgs } = args}
        <InputGroup {color} {variant} {size}>
            <Button>Left</Button>
            <ComboButton {...otherArgs} />
            <Button>Right</Button>
        </InputGroup>
    {/snippet}
</Story>
