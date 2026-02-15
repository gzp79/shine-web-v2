<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { page } from '$app/state';
    import { t } from '@lib/i18n/i18n.svelte';
    import { logUser } from '@lib/loggers';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';
    import { createOtherError } from '@lib/utils';

    let errorType = $derived(page.url.searchParams.get('type'));
    let returnUrl = $derived(page.url.searchParams.get('returnUrl'));

    // Automatically redirect by error type, if applicable
    let autoReturnUrl = $derived.by(() => {
        if (
            errorType === 'auth-login-required' ||
            errorType === 'auth-token-expired' ||
            errorType === 'auth-error' ||
            errorType === 'auth-session-expired'
        ) {
            const searchParams = new URLSearchParams({ prompt: 'true' });
            if (errorType !== 'auth-login-required') {
                searchParams.append('hint', 'login-expired');
            }
            if (returnUrl) {
                searchParams.append('target', returnUrl);
            }
            return resolve('/login') + `?${searchParams}`;
        } else if (errorType === 'auth-email-login') {
            return resolve('/public/email-login');
        }

        return undefined;
    });

    $effect(() => {
        if (autoReturnUrl) {
            logUser.info(`Redirecting to ${autoReturnUrl}`);
            goto(autoReturnUrl);
        }
    });

    let message = $derived.by(() => {
        switch (errorType) {
            case 'auth-register-external-id-conflict':
                return $t('error.authRegisterExternalIdConflict');
            default:
                return page.error?.message ?? '';
        }
    });
</script>

<CenteredLayout>
    {errorType}
    {#if !autoReturnUrl}
        <ErrorCard error={createOtherError(message)}>
            {#snippet actions()}
                <Button color="primary" href={returnUrl || '/game'}>{$t('common.back')}</Button>
            {/snippet}
        </ErrorCard>
    {/if}
</CenteredLayout>
