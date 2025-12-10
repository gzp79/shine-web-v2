<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect } from 'storybook/test';
    import { spacingList } from '@lib/ui/atoms';
    import Stack, { alignmentList, directionList, justificationList } from '@lib/ui/atoms/layouts/Stack.svelte';

    const { Story } = defineMeta({
        component: Stack,
        title: 'Atoms/Layouts/Stack',
        args: {},
        argTypes: {
            direction: {
                control: { type: 'select' },
                options: ['default', ...directionList],
                mapping: {
                    default: undefined
                }
            },
            spacing: {
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
            alignment: {
                control: { type: 'select' },
                options: ['default', ...alignmentList],
                mapping: {
                    default: undefined
                }
            },
            justification: {
                control: { type: 'select' },
                options: ['default', ...justificationList],
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

<Story name="Default">
    <div class="p-4 bg-primary whitespace-nowrap">JavaScript</div>
    <div class="p-4 bg-secondary whitespace-nowrap">TypeScript</div>
    <div class="p-4 bg-info whitespace-nowrap">React</div>
    <div class="p-4 bg-success whitespace-nowrap">Svelte</div>
    <div class="p-4 bg-warning whitespace-nowrap">Vue.js</div>
    <div class="p-4 bg-danger whitespace-nowrap">Angular</div>
    <div class="p-4 bg-primary whitespace-nowrap">Node.js</div>
    <div class="p-4 bg-secondary whitespace-nowrap">Python</div>
</Story>

<Story name="Row Direction">
    {#snippet template(args)}
        {@const { children, direction, ...otherArgs } = args}
        <Stack {...otherArgs} direction="row">
            <div class="p-4 bg-primary">First</div>
            <div class="p-4 bg-secondary">Second</div>
            <div class="p-4 bg-info">Third</div>
        </Stack>
    {/snippet}
</Story>

<Story name="Column Direction">
    {#snippet template(args)}
        {@const { children, direction, ...otherArgs } = args}
        <Stack {...otherArgs} direction="column">
            <div class="p-4 bg-primary">First</div>
            <div class="p-4 bg-secondary">Second</div>
            <div class="p-4 bg-info">Third</div>
        </Stack>
    {/snippet}
</Story>

<Story name="Spacing Variations">
    {#snippet template(args)}
        {@const { children, spacing, ...otherArgs } = args}
        <Stack direction="column" spacing={6}>
            <Stack direction="column">
                <div class="font-bold">No Spacing (0)</div>
                <Stack {...otherArgs} spacing={0}>
                    <div class="p-2 bg-primary text-sm">Item 1</div>
                    <div class="p-2 bg-secondary text-sm">Item 2</div>
                    <div class="p-2 bg-info text-sm">Item 3</div>
                </Stack>
            </Stack>
            <Stack direction="column">
                <div class="font-bold">Small (2)</div>
                <Stack {...otherArgs} spacing={2}>
                    <div class="p-2 bg-primary text-sm">Item 1</div>
                    <div class="p-2 bg-secondary text-sm">Item 2</div>
                    <div class="p-2 bg-info text-sm">Item 3</div>
                </Stack>
            </Stack>
            <Stack direction="column">
                <div class="font-bold">Large (8)</div>
                <Stack {...otherArgs} spacing={8}>
                    <div class="p-2 bg-primary text-sm">Item 1</div>
                    <div class="p-2 bg-secondary text-sm">Item 2</div>
                    <div class="p-2 bg-info text-sm">Item 3</div>
                </Stack>
            </Stack>
        </Stack>
    {/snippet}
</Story>

<Story name="Alignment" args={{ direction: 'row' }}>
    {#snippet template(args)}
        {@const { children, alignment, ...otherArgs } = args}
        <Stack direction="column" spacing={6}>
            <Stack direction="column">
                <div class="font-bold">Align Start</div>
                <Stack {...otherArgs} alignment="start" class="h-32 bg-surface">
                    <div class="p-4 bg-primary h-24">Tall</div>
                    <div class="p-4 bg-secondary">Short</div>
                    <div class="p-4 bg-info h-16">Medium</div>
                </Stack>
            </Stack>
            <Stack direction="column">
                <div class="font-bold">Align Center</div>
                <Stack {...otherArgs} alignment="center" class="h-32 bg-surface">
                    <div class="p-4 bg-primary h-24">Tall</div>
                    <div class="p-4 bg-secondary">Short</div>
                    <div class="p-4 bg-info h-16">Medium</div>
                </Stack>
            </Stack>
            <Stack direction="column">
                <div class="font-bold">Align End</div>
                <Stack {...otherArgs} alignment="end" class="h-32 bg-surface">
                    <div class="p-4 bg-primary h-24">Tall</div>
                    <div class="p-4 bg-secondary">Short</div>
                    <div class="p-4 bg-info h-16">Medium</div>
                </Stack>
            </Stack>
            <Stack direction="column">
                <div class="font-bold">Align Stretch (default)</div>
                <Stack {...otherArgs} alignment="stretch" class="h-32 bg-surface">
                    <div class="p-4 bg-primary">Stretched</div>
                    <div class="p-4 bg-secondary">All Same</div>
                    <div class="p-4 bg-info">Height</div>
                </Stack>
            </Stack>
        </Stack>
    {/snippet}
</Story>

<Story name="Justify" args={{ direction: 'row' }}>
    {#snippet template(args)}
        {@const { children, justification, ...otherArgs } = args}
        <Stack direction="column" spacing={6}>
            <Stack direction="column">
                <div class="font-bold">Justify Start</div>
                <Stack {...otherArgs} justification="start">
                    <div class="p-2 bg-primary">A</div>
                    <div class="p-2 bg-secondary">B</div>
                    <div class="p-2 bg-info">C</div>
                </Stack>
            </Stack>
            <Stack direction="column">
                <div class="font-bold">Justify Center</div>
                <Stack {...otherArgs} justification="center">
                    <div class="p-2 bg-primary">A</div>
                    <div class="p-2 bg-secondary">B</div>
                    <div class="p-2 bg-info">C</div>
                </Stack>
            </Stack>
            <Stack direction="column">
                <div class="font-bold">Justify End</div>
                <Stack {...otherArgs} justification="end">
                    <div class="p-2 bg-primary">A</div>
                    <div class="p-2 bg-secondary">B</div>
                    <div class="p-2 bg-info">C</div>
                </Stack>
            </Stack>
            <Stack direction="column">
                <div class="font-bold">Justify Between</div>
                <Stack {...otherArgs} justification="between">
                    <div class="p-2 bg-primary">A</div>
                    <div class="p-2 bg-secondary">B</div>
                    <div class="p-2 bg-info">C</div>
                </Stack>
            </Stack>
            <Stack direction="column">
                <div class="font-bold">Justify Around</div>
                <Stack {...otherArgs} justification="around">
                    <div class="p-2 bg-primary">A</div>
                    <div class="p-2 bg-secondary">B</div>
                    <div class="p-2 bg-info">C</div>
                </Stack>
            </Stack>
            <Stack direction="column">
                <div class="font-bold">Justify Evenly</div>
                <Stack {...otherArgs} justification="evenly">
                    <div class="p-2 bg-primary">A</div>
                    <div class="p-2 bg-secondary">B</div>
                    <div class="p-2 bg-info">C</div>
                </Stack>
            </Stack>
        </Stack>
    {/snippet}
</Story>

<Story name="Wrap" args={{ direction: 'row' }}>
    {#snippet template(args)}
        {@const { children, wrap, ...otherArgs } = args}
        <Stack direction="column" spacing={6}>
            <Stack direction="column">
                <div class="font-bold">Without Wrap</div>
                <div class="max-w-xl h-64 border-2 border-dashed border-primary p-2 overflow-auto">
                    <Stack {...otherArgs} wrap={false} class="h-full">
                        <div class="p-4 h-16 bg-primary whitespace-nowrap">JavaScript</div>
                        <div class="p-4 h-16 bg-secondary whitespace-nowrap">TypeScript</div>
                        <div class="p-4 h-16 bg-info whitespace-nowrap">React</div>
                        <div class="p-4 h-16 bg-success whitespace-nowrap">Svelte</div>
                        <div class="p-4 h-16 bg-warning whitespace-nowrap">Vue.js</div>
                        <div class="p-4 h-16 bg-danger whitespace-nowrap">Angular</div>
                        <div class="p-4 h-16 bg-primary whitespace-nowrap">Node.js</div>
                        <div class="p-4 h-16 bg-secondary whitespace-nowrap">Python</div>
                    </Stack>
                </div>
            </Stack>
            <Stack direction="column">
                <div class="font-bold">With Wrap</div>
                <div class="max-w-xl h-64 border-2 border-dashed border-primary p-2 overflow-auto">
                    <Stack {...otherArgs} wrap={true} class="h-full">
                        <div class="p-4 h-16 bg-primary whitespace-nowrap">JavaScript</div>
                        <div class="p-4 h-16 bg-secondary whitespace-nowrap">TypeScript</div>
                        <div class="p-4 h-16 bg-info whitespace-nowrap">React</div>
                        <div class="p-4 h-16 bg-success whitespace-nowrap">Svelte</div>
                        <div class="p-4 h-16 bg-warning whitespace-nowrap">Vue.js</div>
                        <div class="p-4 h-16 bg-danger whitespace-nowrap">Angular</div>
                        <div class="p-4 h-16 bg-primary whitespace-nowrap">Node.js</div>
                        <div class="p-4 h-16 bg-secondary whitespace-nowrap">Python</div>
                    </Stack>
                </div>
            </Stack>
        </Stack>
    {/snippet}
</Story>

<Story name="Grow Children" args={{ direction: 'row' }}>
    {#snippet template(args)}
        {@const { children, grow, ...otherArgs } = args}
        <Stack direction="column" spacing={6}>
            <Stack direction="column">
                <div class="font-bold">Without Grow</div>
                <Stack {...otherArgs} grow={false}>
                    <div class="p-2 bg-primary">Small</div>
                    <div class="p-2 bg-secondary">Medium Content</div>
                    <div class="p-2 bg-info">A</div>
                </Stack>
            </Stack>
            <Stack direction="column">
                <div class="font-bold">With Grow</div>
                <Stack {...otherArgs} grow={true}>
                    <div class="p-2 bg-primary">Small</div>
                    <div class="p-2 bg-secondary">Medium Content</div>
                    <div class="p-2 bg-info">A</div>
                </Stack>
            </Stack>
        </Stack>
    {/snippet}
</Story>
