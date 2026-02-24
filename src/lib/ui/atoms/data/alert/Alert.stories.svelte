<script module lang="ts">
    import { lorem } from '@sb/lorem';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import {
        Alert,
        AlertDescription,
        AlertItem,
        AlertSeparator,
        AlertTitle,
        alertVariantList
    } from '@lib/ui/atoms/data/alert';
    import Settings from '@lib/ui/atoms/icons/common/Settings.svelte';

    const { Story } = defineMeta({
        component: Alert,
        title: 'Atoms/Data/Alert',
        args: {
            variant: 'info',
            title: 'Alert Title'
        },
        argTypes: {
            variant: {
                control: { type: 'select' },
                options: alertVariantList
            }
        }
    });
</script>

<Story name="Default" />

<Story name="Error Variant">
    {#snippet template(args)}
        <Alert {...args} variant="error" title="Something went wrong. Please try again." />
    {/snippet}
</Story>

<Story name="Warning Variant">
    {#snippet template(args)}
        <Alert {...args} variant="warning" title="This action may have unintended consequences." />
    {/snippet}
</Story>

<Story name="Info Variant">
    {#snippet template(args)}
        <Alert {...args} variant="info" title="Here's some useful information for you." />
    {/snippet}
</Story>

<Story name="Success Variant">
    {#snippet template(args)}
        <Alert {...args} variant="success" title="Operation completed successfully!" />
    {/snippet}
</Story>

<Story name="Fully Customized">
    {#snippet template(args)}
        {@const { children, title, ...otherArgs } = args}
        <Alert {...otherArgs}>
            {#snippet icon({ class: cls })}
                <div class={cls}>
                    <Settings class="absolute animate-ping w-6 h-6" />
                    <Settings class="relative w-6 h-6" />
                </div>
            {/snippet}
            <AlertTitle class="h3">Custom Alert Title</AlertTitle>
            <AlertSeparator />
            <AlertDescription class="overflow-auto max-h-90 px-2">{lorem.long}</AlertDescription>
            <AlertSeparator />
            <AlertItem>
                <Typography variant="footnote" class="text-end">
                    Some additional custom alert content goes here.
                </Typography>
            </AlertItem>
            <AlertTitle class="h3 text-center">That's all folks!</AlertTitle>
        </Alert>
    {/snippet}
</Story>
