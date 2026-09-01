<script lang="ts">
    import { resolve } from '$app/paths';
    import { page } from '$app/state';
    import { getLocaleContext } from '@lib/i18n';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';
    import { type ErrorType, createOtherError } from '@lib/utils';
    import type { PageData } from './$types';

    const locale = getLocaleContext();

    let { data }: { data: PageData } = $props();

    let errorType = $derived(page.url.searchParams.get('errorType') as ErrorType | null);
    let errorDetail = $derived(page.state.errorDetail);
    let returnUrl = $derived.by(() => {
        if (data.returnUrl) {
            return data.returnUrl;
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
                return locale.t('error.authRegisterExternalIdConflict');
            case 'auth-not-confirmed':
                return locale.t('error.authNotConfirmed');
            case 'internal-error':
                return locale.t('errors.internalError');
            default:
                return page.error?.message ?? '';
        }
    });
</script>

<CenteredLayout>
    <ErrorCard error={createOtherError(message, errorDetail)}>
        {#snippet actions()}
            <Button color="primary" href={returnUrl || '/game'}>
                {errorDetail ? locale.t('common.refresh') : locale.t('common.back')}
            </Button>
        {/snippet}
    </ErrorCard>
</CenteredLayout>
