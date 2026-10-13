<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import AuthGuard from '@lib/account/AuthGuard.svelte';
    import LogoutGuard from '@lib/account/LogoutGuard.svelte';
    import { getLocaleContext } from '@lib/i18n';
    import { logUser } from '@lib/loggers';
    import { getMenuContext } from '@lib/ui/app/AppMenu.svelte';
    import Settings from '@lib/ui/atoms/icons/common/Settings.svelte';
    import BuilderShell from './BuilderShell.svelte';

    let { children } = $props();

    const locale = getLocaleContext();
    const appMenu = getMenuContext();

    $effect(() => {
        logUser.log('Registering account menu items');
        const unregisters = [
            appMenu.register({
                id: 'account-info',
                section: 'user',
                label: locale.t('account.accountInfo'),
                icon: Settings,
                action: () => goto(resolve('/(auth)/account'))
            })
        ];
        return () => unregisters.forEach((fn) => fn());
    });
</script>

<AuthGuard>
    <LogoutGuard>
        <BuilderShell>
            {@render children()}
        </BuilderShell>
    </LogoutGuard>
</AuthGuard>
