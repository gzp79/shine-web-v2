<script module lang="ts">
    export type HintInfo = {
        loginText?: string;
        allowGuest: boolean;
    };
</script>

<script lang="ts">
    import { page } from '$app/state';
    import { config } from '@config';
    import { queryCurrentUserInfo } from '@lib/account/account.remote';
    import { queryExternalLoginProviders, querySanitizedReturnUrl } from '@lib/account/login.remote';
    import { queryAssetUrls } from '@lib/assets/assets.remote';
    import { t } from '@lib/i18n/i18n.svelte';
    import { logUser } from '@lib/loggers';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Overlay from '@lib/ui/atoms/Overlay.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';
    import LoadingCard from '@lib/ui/components/cards/LoadingCard.svelte';
    import { createAppError } from '@lib/utils';

    const prompt = $derived(page.url.searchParams.get('prompt'));
    const extraInfo: HintInfo = $derived.by(() => {
        let hint = page.url.searchParams.get('hint') || '';
        switch (hint) {
            case 'login-expired':
                return {
                    loginText: $t('login.info.loginExpired'),
                    allowGuest: true
                };
            case 'email-confirm':
                return {
                    loginText: $t('login.info.emailConfirm'),
                    allowGuest: false
                };
            case 'email-change':
                return {
                    loginText: $t('login.info.emailChange'),
                    allowGuest: false
                };
            default:
                return {
                    allowGuest: true
                };
        }
    });

    const returnUrl = async () => {
        const rawUrl = page.url.searchParams.get('returnUrl') ?? '';
        const target = decodeURIComponent(rawUrl) ?? '/game';
        const sanitizedURL = querySanitizedReturnUrl(target).current;
        if (sanitizedURL) {
            logUser.log(`Sanitized returnUrl: [${sanitizedURL}]`);
        }
        return sanitizedURL;
    };

    const providers = queryExternalLoginProviders();
    const currentUser = queryCurrentUserInfo();
    const backgroundUrls = queryAssetUrls(['loginBackground', 'loginBackground_alt']);

    const hasCaptcha = !config.turnstile.disable;
    if (!hasCaptcha) {
        console.warn('Captcha is disabled');
    }

    // when captcha is disabled use a test (site) key that always passes the server side validation
    let captcha = $state(hasCaptcha ? '' : '1x00000000000000000000AA');
    let rememberMe = $state(true);

    let waitLoading = $state(true);
    const showLoading = $derived(waitLoading || !captcha || !returnUrl);
</script>

<CenteredLayout>
    <svelte:boundary>
        {#snippet pending()}
            <LoadingCard />
        {/snippet}

        {#snippet failed(error, reset)}
            <ErrorCard error={createAppError(error)} width="full">
                {#snippet actions()}
                    <Button
                        onclick={async () => {
                            await currentUser.refresh();
                            await providers.refresh();
                            reset();
                        }}
                    >
                        {$t('common.retry')}
                    </Button>
                {/snippet}
            </ErrorCard>
        {/snippet}

        <Overlay src={Object.values(await backgroundUrls)} opacity={0.25} />

        Login<br />
        {await returnUrl()} <br />
        {JSON.stringify(await providers)} <br />
        {JSON.stringify(await currentUser)} <br />
        {JSON.stringify(await backgroundUrls)} <br />
        prompt: {prompt} <br />
        extraInfo: {JSON.stringify(extraInfo)} <br />
        captcha: {captcha} <br />
        rememberMe: {rememberMe} <br />
        showLoading: {showLoading} <br />

        <a href="/account">Go to Login Page</a>
    </svelte:boundary>
</CenteredLayout>
