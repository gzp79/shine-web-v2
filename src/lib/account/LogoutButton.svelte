<script module lang="ts">
    export type LogoutButtonProps = {
        isLinked: boolean;
        disabled?: boolean;
    };
</script>

<script lang="ts">
    import { authPages } from '@lib/api/authPages';
    import { getLocaleContext } from '@lib/i18n';
    import ComboButton from '@lib/ui/components/buttons/ComboButton.svelte';
    import ConfirmationDialog from '@lib/ui/components/dialogs/ConfirmationDialog.svelte';

    let { isLinked, disabled = false }: LogoutButtonProps = $props();

    const locale = getLocaleContext();

    const logoutUrl = authPages.logoutUrl({ terminateAll: false, redirectUrl: '/public/bye' });
    const logoutAllUrl = authPages.logoutUrl({ terminateAll: true, redirectUrl: '/public/bye' });

    let warnOpen = $state(false);
    let pendingLogoutUrl = $state<string | undefined>(undefined);

    const warnBeforeLogout = (url: string) => {
        pendingLogoutUrl = url;
        warnOpen = true;
    };

    const options = $derived(
        isLinked
            ? [
                  { caption: locale.t('account.logout'), href: logoutUrl },
                  { caption: locale.t('account.logoutAll'), href: logoutAllUrl }
              ]
            : [
                  { caption: locale.t('account.logout'), onclick: () => warnBeforeLogout(logoutUrl) },
                  { caption: locale.t('account.logoutAll'), onclick: () => warnBeforeLogout(logoutAllUrl) }
              ]
    );
</script>

<ComboButton {disabled} {options} />

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
