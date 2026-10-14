<script module lang="ts">
    import MockApp from '#sb/MockApp.svelte';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import AppCenteredLayout from '#lib/ui/app/CenteredLayout.svelte';
    import Typography from '#lib/ui/atoms/Typography.svelte';
    import Button from '#lib/ui/atoms/input/Button.svelte';
    import Box from '#lib/ui/atoms/layouts/Box.svelte';

    const { Story } = defineMeta({
        title: 'Components/App/CenteredLayout',
        component: AppCenteredLayout
    });
</script>

<Story name="Single button" asChild>
    <MockApp>
        <AppCenteredLayout>
            <Button color="primary">
                <Typography>Click Me</Typography>
            </Button>
        </AppCenteredLayout>
    </MockApp>
</Story>

<Story name="Some box" asChild>
    <MockApp>
        <AppCenteredLayout>
            <Box color="primary">
                <Typography variant="h1">Welcome</Typography>
                <Typography>This is a center message.</Typography>
            </Box>
        </AppCenteredLayout>
    </MockApp>
</Story>
