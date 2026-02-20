<script module lang="ts">
    import { withinPopover } from '@sb/models/popover';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect, userEvent, waitFor, within } from 'storybook/test';
    import { getLocaleContext } from '@lib/i18n';
    import { getThemeContext } from '@lib/theme/_theme.svelte';
    import App from '@lib/ui/app/App.svelte';
    import { getMenuContext } from '@lib/ui/app/AppMenu.svelte';
    import AppCenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';

    const { Story } = defineMeta({
        title: 'Components/App/AppMenu',
        component: AppCenteredLayout,
        play: async ({ canvasElement }) => {
            expect(canvasElement).toBeDefined();
        }
    });
</script>

<script lang="ts">
    const theme = getThemeContext();
    const locale = getLocaleContext();
</script>

<Story
    name="App menu"
    play={async ({ canvasElement, step }) => {
        const canvas = within(canvasElement);
        const itemsDisplay = canvas.getByText(/Registered items:/);
        const menuButton = canvas.getByRole('button', { name: '' });
        const popover = withinPopover();

        await step('Initially should have no items', async () => {
            expect(itemsDisplay).toHaveTextContent('Registered items:');
        });

        await step('Register new menu item', async () => {
            const registerBtn = canvas.getByRole('button', { name: 'Register' });
            await userEvent.click(registerBtn);

            await waitFor(() => {
                expect(itemsDisplay).toHaveTextContent('Registered items: New Item');
            });
        });

        await step('Verify item appears in AppMenu popup', async () => {
            await userEvent.click(menuButton);

            const newMenuItem = await waitFor(() => {
                const item = popover.getByRole('menuitem', { name: 'New Item' });
                expect(item).toBeVisible();
                return item;
            });

            await userEvent.click(menuButton, { pointerEventsCheck: 0 });
            await waitFor(() => {
                expect(newMenuItem).not.toBeVisible();
            });
        });

        await step('Unregister menu item', async () => {
            const unregisterBtn = canvas.getByRole('button', { name: 'Unregister' });
            await userEvent.click(unregisterBtn);

            await waitFor(() => {
                expect(itemsDisplay).toHaveTextContent('Registered items:');
            });
        });

        await step('Verify item is removed from AppMenu popup', async () => {
            await userEvent.click(menuButton);

            await waitFor(() => {
                const items = popover.queryAllByRole('menuitem', { name: 'New Item' });
                expect(items).toHaveLength(0);
            });
        });

        await step('Close menu', async () => {
            await userEvent.click(menuButton, { pointerEventsCheck: 0 });

            await waitFor(() => {
                const menuItems = popover.queryAllByRole('menuitem');
                expect(menuItems.length).toBe(0);
            });
        });
    }}
>
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
