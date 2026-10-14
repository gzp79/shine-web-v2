<script module lang="ts">
    import MockApp from '#sb/MockApp.svelte';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { getAppMenuContext } from '#lib/ui/app/AppMenu.svelte';
    import AppCenteredLayout from '#lib/ui/app/CenteredLayout.svelte';
    import Typography from '#lib/ui/atoms/Typography.svelte';
    import Button from '#lib/ui/atoms/input/Button.svelte';

    const { Story } = defineMeta({
        title: 'Components/App/AppMenu',
        component: AppCenteredLayout
    });
</script>

<Story name="App menu" asChild>
    <MockApp>
        {@const appMenu = getAppMenuContext()}
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
    </MockApp>
</Story>
