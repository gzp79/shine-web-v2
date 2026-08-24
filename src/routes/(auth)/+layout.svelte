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
    import Chat from '@lib/ui/atoms/icons/common/Chat.svelte';
    import Settings from '@lib/ui/atoms/icons/common/Settings.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';
    import { createAppError } from '@lib/utils';

    let { children } = $props();

    const locale = getLocaleContext();
    const appMenu = getMenuContext();

    // Make a chat connection available to every page in the auth region. It stays idle
    // until a page actually uses it (useChatConnection), and is disposed on region teardown.
    provideChatConnection();

    $effect(() => {
        logUser.log('Registering account menu items');
        const unregisters = [
            appMenu.register({
                id: 'account-info',
                section: 'user',
                label: locale.t('account.accountInfo'),
                icon: Settings,
                action: () => goto(resolve('/account'))
            }),
            appMenu.register({
                id: 'chat',
                section: 'global',
                label: locale.t('chat.chat'),
                icon: Chat,
                action: () => goto(resolve('/chat'))
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
        </svelte:boundary>
    </LogoutGuard>
</AuthGuard>
