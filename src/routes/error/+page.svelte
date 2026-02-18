<script lang="ts">
    import { resolve } from '$app/paths';
    import { page } from '$app/state';
    import type { ErrorType } from '@lib/account/auth';
    import { t } from '@lib/i18n/i18n.svelte';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';
    import { createOtherError } from '@lib/utils';

    let errorType = $derived(page.url.searchParams.get('errorType') as ErrorType | null);
    let returnUrl = $derived.by(() => {
        const redirectUrl = page.url.searchParams.get('returnUrl');
        if (redirectUrl) {
            return redirectUrl;
        }

        if (
            errorType === 'auth-login-required' ||
            errorType === 'auth-token-expired' ||
            errorType === 'auth-error' ||
            errorType === 'auth-session-expired'
        ) {
            const searchParams = new URLSearchParams({
                prompt: 'true',
                errorType
            });
            return resolve('/login') + `?${searchParams}`;
        }

        return resolve('/game');
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
    <ErrorCard error={createOtherError(message)}>
        {#snippet actions()}
            <Button color="primary" href={returnUrl || '/game'}>{$t('common.back')}</Button>
        {/snippet}
    </ErrorCard>
</CenteredLayout>
