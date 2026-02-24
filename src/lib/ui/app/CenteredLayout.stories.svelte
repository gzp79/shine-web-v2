<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { getLocaleContext } from '@lib/i18n';
    import { getThemeContext } from '@lib/theme/_theme.svelte';
    import App from '@lib/ui/app/App.svelte';
    import AppCenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';

    const { Story } = defineMeta({
        title: 'Components/App/CenteredLayout',
        component: AppCenteredLayout
    });
</script>

<script lang="ts">
    const theme = getThemeContext();
    const locale = getLocaleContext();
</script>

<Story name="Single button">
    {#snippet template(args)}
        <App theme={theme.current} locale={locale.current}>
            <AppCenteredLayout>
                <Button color="primary">
                    <Typography>Click Me</Typography>
                </Button>
            </AppCenteredLayout>
        </App>
    {/snippet}
</Story>

<Story name="Some box">
    {#snippet template(args)}
        <App theme={theme.current} locale={locale.current}>
            <AppCenteredLayout>
                <Box color="primary">
                    <Typography variant="h1">Welcome</Typography>
                    <Typography>This is a center message.</Typography>
                </Box>
            </AppCenteredLayout>
        </App>
    {/snippet}
</Story>
