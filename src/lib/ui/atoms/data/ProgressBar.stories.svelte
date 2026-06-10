<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { actionColorList, sizeList } from '@lib/ui/atoms';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import ProgressBar, { type ProgressBarDisplay } from '@lib/ui/atoms/data/ProgressBar.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';

    const { Story } = defineMeta({
        component: ProgressBar,
        title: 'Atoms/Data/ProgressBar',
        args: {
            value: 50,
            color: undefined,
            size: undefined,
            wide: undefined,
            display: undefined,
            label: undefined
        },
        argTypes: {
            color: {
                control: { type: 'select' },
                options: ['default', ...actionColorList],
                mapping: { default: undefined }
            },
            size: {
                control: { type: 'select' },
                options: ['default', ...sizeList],
                mapping: { default: undefined }
            },
            display: {
                control: { type: 'select' },
                options: ['default', 'none', 'percent', 'label'],
                mapping: { default: undefined }
            },
            value: {
                control: { type: 'range', min: 0, max: 100, step: 1 }
            }
        }
    });
</script>

<script lang="ts">
    const presets = [0, 1, 25, 50, 75, 99, 100];
    let interactiveValue = $state(50);
</script>

<Story name="Default" />

<Story name="Display">
    {#snippet template(args)}
        {@const displayList: ProgressBarDisplay[] = ['none', 'percent', 'label']}
        <Stack>
            {#each displayList as display (display)}
                <Stack direction="row" alignment="center" justification="start">
                    <Typography class="w-16">{display}</Typography>
                    <ProgressBar {...args} {display} label="Uploading" wide />
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
                    <ProgressBar {...otherArgs} {color} wide />
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
                    <ProgressBar {...otherArgs} {size} wide />
                </Stack>
            {/each}
        </Stack>
    {/snippet}
</Story>

<Story name="Interactive">
    {#snippet template(args)}
        <Stack>
            <ProgressBar {...args} value={interactiveValue} wide />
            <Stack direction="row" alignment="center" justification="start" wrap>
                {#each presets as p (p)}
                    <Button size="sm" color="secondary" onclick={() => (interactiveValue = p)}>
                        {p}%
                    </Button>
                {/each}
            </Stack>
        </Stack>
    {/snippet}
</Story>
