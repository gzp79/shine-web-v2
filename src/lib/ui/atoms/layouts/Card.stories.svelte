<script module lang="ts">
    import { lorem } from '#sb/lorem';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { actionColorList, spacingList } from '#lib/ui/atoms';
    import Typography from '#lib/ui/atoms/Typography.svelte';
    import Firefox from '#lib/ui/atoms/glyphs/brands/Firefox.svelte';
    import Dots from '#lib/ui/atoms/icons/animated/Dots.svelte';
    import Warning from '#lib/ui/atoms/icons/common/Warning.svelte';
    import Button from '#lib/ui/atoms/input/Button.svelte';
    import { layoutWidthList } from '#lib/ui/atoms/layouts';
    import Card, { type CardProps, cardVariantList } from '#lib/ui/atoms/layouts/Card.svelte';
    import Stack from '#lib/ui/atoms/layouts/Stack.svelte';
    import { cn } from '#lib/ui/utils';

    // `content` is a story-only arg (a lorem preset picker), so the args type comes from the
    // `render` snippet rather than from Card's props alone.
    type CardArgs = CardProps & {
        content?: string;
    };

    const { Story } = defineMeta({
        component: Card,
        title: 'Atoms/Layouts/Card',
        render: template,
        args: {
            content: 'medium'
        },
        argTypes: {
            variant: {
                control: { type: 'select' },
                options: [...cardVariantList]
            },
            color: {
                control: { type: 'select' },
                options: ['default', ...actionColorList],
                mapping: {
                    default: undefined
                }
            },
            width: {
                control: { type: 'select' },
                options: ['default', ...layoutWidthList],
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
            },
            content: {
                control: { type: 'select' },
                options: ['none', 'short', 'medium', 'long'],
                mapping: {
                    none: undefined,
                    short: lorem.short,
                    medium: lorem.medium,
                    long: lorem.long
                }
            },
            children: { control: false, table: { disable: true } },
            icon: { control: false, table: { disable: true } },
            actions: { control: false, table: { disable: true } }
        }
    });
</script>

{#snippet cardGlyph(props: { class: string })}
    <Firefox class={props.class} />
{/snippet}

{#snippet cardIcon(props: { class: string })}
    <Warning class={props.class} />
{/snippet}

{#snippet cardContent(args: CardArgs)}
    <Typography variant="text">
        {args.content}
    </Typography>
{/snippet}

{#snippet cardActions()}
    <Button onclick={() => alert('Cancel clicked')}>Cancel</Button>
    <Button color="primary" onclick={() => alert('Confirm clicked')}>Confirm</Button>
{/snippet}

{#snippet template(args: CardArgs)}
    {@const { children, ...otherArgs } = args}
    <Card {...otherArgs} contentClass="max-h-48">
        {@render cardContent(args)}
    </Card>
{/snippet}

<Story name="Box like" />

<Story name="With title" args={{ title: 'Card Title' }} />

<Story name="With icon" args={{ icon: cardGlyph }} />

<Story name="With title and icon" args={{ title: 'Card Title', icon: cardGlyph }} />

<Story name="With actions" args={{ actions: cardActions }} />

<Story name="With title and actions" args={{ title: 'Card Title', actions: cardActions }} />

<Story name="With icon and actions" args={{ icon: cardGlyph, actions: cardActions }} />

<Story name="With all features">
    {#snippet template(args)}
        {@const { children, ...otherArgs } = args}
        <Card {...otherArgs} contentClass="max-h-48">
            {#snippet icon({ class: cls })}
                <Firefox class={cn(cls, 'grayscale-100')} />
            {/snippet}
            {#snippet title({ class: cls })}
                <Typography element="h1" variant="h2" class={cls}>Custom Title Snippet <Dots /></Typography>
            {/snippet}
            {@render cardContent(args)}
            {#snippet actions()}
                <Button onclick={() => alert('Cancel clicked')}>Cancel</Button>
                <Button color="primary" onclick={() => alert('Confirm clicked')}>Confirm</Button>
            {/snippet}
        </Card>
    {/snippet}
</Story>

<Story name="Variants" args={{ color: 'danger' }}>
    {#snippet template(args)}
        {@const { children, ...otherArgs } = args}
        <Stack spacing={4}>
            {#each cardVariantList as variant (variant)}
                <Card {...otherArgs} {variant} title="Variant: {variant}" icon={cardIcon} contentClass="max-h-48">
                    {@render cardContent(args)}
                </Card>
            {/each}
        </Stack>
    {/snippet}
</Story>

<Story name="Nesting">
    {#snippet template(args)}
        {@const { children, ...otherArgs } = args}
        <Card title="Parent Card">
            {#snippet icon({ class: cls })}
                <Dots class={cls} />
            {/snippet}
            <Stack>
                <Card {...otherArgs} title="Title" icon={cardGlyph} contentClass="max-h-48">
                    {@render cardContent(args)}
                    {#snippet actions()}
                        <Button onclick={() => alert('Cancel clicked')}>Cancel</Button>
                        <Button color="primary" onclick={() => alert('Confirm clicked')}>Confirm</Button>
                    {/snippet}
                </Card>
                <Card color="warning" title="Warning (default)" icon={cardIcon} contentClass="max-h-48">
                    {@render cardContent(args)}
                </Card>
                <Card color="warning" variant="solid" title="Warning (solid)" icon={cardIcon} contentClass="max-h-48">
                    {@render cardContent(args)}
                </Card>
            </Stack>
        </Card>
    {/snippet}
</Story>
