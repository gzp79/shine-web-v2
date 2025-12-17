<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect } from 'storybook/test';
    import { createLocaleContext } from '@lib/i18n/i18n.svelte';
    import { createThemeContext } from '@lib/theme/theme.svelte';
    import App from '@lib/ui/app/App.svelte';
    import AppMessageContent from '@lib/ui/app/MessageContent.svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';

    const { Story } = defineMeta({
        title: 'Components/App',
        component: AppMessageContent,
        play: async ({ canvasElement }) => {
            expect(canvasElement).toBeDefined();
        }
    });
</script>

<script lang="ts">
    const theme = createThemeContext();
    const locale = createLocaleContext();
</script>

<Story name="Single button">
    {#snippet template(args)}
        <App theme={theme.current} locale={locale.current}>
            <AppMessageContent>
                <Button color="primary">
                    <Typography>Click Me</Typography>
                </Button>
            </AppMessageContent>
        </App>
    {/snippet}
</Story>

<Story name="Some box">
    {#snippet template(args)}
        <App theme={theme.current} locale={locale.current}>
            <AppMessageContent>
                <Box color="primary">
                    <Typography variant="h1">Welcome</Typography>
                    <Typography>This is a center message.</Typography>
                </Box>
            </AppMessageContent>
        </App>
    {/snippet}
</Story>
