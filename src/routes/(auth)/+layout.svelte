<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import AuthGuard from '@lib/account/AuthGuard.svelte';
    import LogoutGuard from '@lib/account/LogoutGuard.svelte';
    import { provideChatConnection } from '@lib/builder';
    import { getLocaleContext } from '@lib/i18n';
    import { logUser } from '@lib/loggers';
    import { getMenuContext } from '@lib/ui/app/AppMenu.svelte';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import { getConnectionStatusContext } from '@lib/ui/app/ConnectionStatus.svelte';
    import Settings from '@lib/ui/atoms/icons/common/Settings.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';
    import { ChatPanel } from '@lib/ui/components/chat';
    import { createAppError } from '@lib/utils';

    let { children } = $props();

    const locale = getLocaleContext();
    const appMenu = getMenuContext();
    const connectionStatus = getConnectionStatusContext();

    // Establish the connection for the whole auth region up front, so the app-shell
    // status indicator always reflects live state, not just once a page opens the panel.
    const connection = provideChatConnection();
    connection.connect();

    let chatOpen = $state(false);

    $effect(() => {
        connectionStatus.set({
            get status() {
                return connection.status;
            },
            get hasUnread() {
                return connection.hasUnread;
            },
            onClick: () => {
                chatOpen = true;
            }
        });
        return () => connectionStatus.set(undefined);
    });

    $effect(() => {
        logUser.log('Registering account menu items');
        const unregisters = [
            appMenu.register({
                id: 'account-info',
                section: 'user',
                label: locale.t('account.accountInfo'),
                icon: Settings,
                action: () => goto(resolve('/account'))
            })
        ];
        return () => unregisters.forEach((fn) => fn());
    });
</script>

<AuthGuard>
    <LogoutGuard>
        <svelte:boundary>
            {#snippet failed(error, reset)}
                <CenteredLayout>
                    <ErrorCard error={createAppError(error)}>
                        <Button onclick={() => reset()}>{locale.t('common.refresh')}</Button>
                    </ErrorCard>
                </CenteredLayout>
            {/snippet}

            {@render children()}
            <ChatPanel {connection} bind:open={chatOpen} />
        </svelte:boundary>
    </LogoutGuard>
</AuthGuard>
