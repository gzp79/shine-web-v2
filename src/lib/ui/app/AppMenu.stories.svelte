<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { getLocaleContext } from '@lib/i18n';
    import { getThemeContext } from '@lib/theme/_theme.svelte';
    import App from '@lib/ui/app/App.svelte';
    import { getMenuContext } from '@lib/ui/app/AppMenu.svelte';
    import AppCenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';

    const { Story } = defineMeta({
        title: 'Components/App/AppMenu',
        component: AppCenteredLayout
    });
</script>

<script lang="ts">
    const theme = getThemeContext();
    const locale = getLocaleContext();
</script>

<Story name="App menu">
    {#snippet template(args)}
        <App theme={theme.current} locale={locale.current}>
            {@const appMenu = getMenuContext()}
            <AppCenteredLayout>
                <Button
                    onclick={() => {
                        appMenu.register({
                            id: 'menu-id',
                            section: 'context',
                            label: 'New Item'
                        });
                    }}>Register</Button
                >
                <Button
                    onclick={() => {
                        appMenu.unregister('menu-id');
                    }}>Unregister</Button
                >
                <Typography
                    >Registered items: {appMenu
                        .getItemsBySection('context')
                        .map((item) => item.label)
                        .join(', ')}</Typography
                >
            </AppCenteredLayout>
        </App>
    {/snippet}
</Story>
