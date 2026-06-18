<script module lang="ts">
    import { getAuthenticatedUserContext } from '@lib/account/authContext.svelte';
    import { authPages } from '@lib/api/authPages';
    import { getLocaleContext } from '@lib/i18n';
    import { getMenuContext } from '@lib/ui/app/AppMenu.svelte';
    import Cross from '@lib/ui/atoms/icons/common/Cross.svelte';
    import ConfirmationDialog from '@lib/ui/components/dialogs/ConfirmationDialog.svelte';
    import { createContext } from '@lib/ui/utils';

    export type LogoutRequest = {
        terminateAll: boolean;
    };

    export type LogoutContext = {
        requestLogout: (request: LogoutRequest) => void;
    };

    const { get: getLogoutContext, set: setLogoutContext } = createContext<LogoutContext>('logout-context');
    export { getLogoutContext };
</script>

<script lang="ts">
    import type { Snippet } from 'svelte';

    let { children }: { children?: Snippet } = $props();

    const currentUser = getAuthenticatedUserContext();
    const locale = getLocaleContext();
    const appMenu = getMenuContext();

    let warnOpen = $state(false);
    let pendingLogoutUrl = $state<string | undefined>(undefined);

    const isGuest = $derived(!currentUser.user.isLinked);

    const requestLogout = ({ terminateAll }: LogoutRequest) => {
        const logoutUrl = authPages.logoutUrl({ terminateAll, redirectUrl: '/public/bye' });
        if (isGuest) {
            pendingLogoutUrl = logoutUrl;
            warnOpen = true;
        } else {
            window.location.href = logoutUrl;
        }
    };

    setLogoutContext({ requestLogout });

    $effect(() => {
        return appMenu.register({
            id: 'logout',
            section: 'user',
            label: locale.t('account.logout'),
            icon: Cross,
            dangerous: true,
            action: () => requestLogout({ terminateAll: false })
        });
    });
</script>

{@render children?.()}

<ConfirmationDialog
    bind:open={warnOpen}
    color="warning"
    title={locale.t('account.guestLogoutWarningTitle')}
    question={locale.t('account.guestLogoutWarningQuestion')}
    confirm={locale.t('account.logoutAnyway')}
    confirmStyle={{ color: 'danger' }}
    confirmAction={{ href: pendingLogoutUrl }}
    cancel={locale.t('common.cancel')}
/>
