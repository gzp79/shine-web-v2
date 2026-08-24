<script module lang="ts">
    import { page } from '$app/state';
    import { CAPTCHA_SKIP_TOKEN, config } from '@config';
    import type { ErrorType, Hint, HintInfo } from '@lib/account/auth';
    import { queryCurrentUserInfo } from '@lib/account/auth.remote';
    import { queryExternalLoginProviders, querySanitizedReturnUrl } from '@lib/account/auth.remote';
    import { authPages } from '@lib/api/authPages';
    import { queryAssetUrls } from '@lib/assets/assets.remote';
    import { getLocaleContext } from '@lib/i18n';
    import { logUser } from '@lib/loggers';
    import { getThemeContext } from '@lib/theme/_theme.svelte';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Overlay from '@lib/ui/atoms/Overlay.svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Logo from '@lib/ui/atoms/glyphs/Logo.svelte';
    import allBrands from '@lib/ui/atoms/glyphs/brands/all';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Switch from '@lib/ui/atoms/input/Switch.svelte';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';
    import Dialog from '@lib/ui/atoms/layouts/Dialog.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';
    import LoadingCard from '@lib/ui/components/cards/LoadingCard.svelte';
    import Turnstile from '@lib/ui/components/forms/Turnstile.svelte';
    import { async, createAppError, pascalCase } from '@lib/utils';
    import EmailLoginButton from './EmailLoginButton.svelte';
    import MovingBlob from './MovingBlob.svelte';
</script>

<script lang="ts">
    let theme = getThemeContext();
    let locale = getLocaleContext();

    const prompt = $derived(!!page.url.searchParams.get('prompt'));
    const returnUrl = $derived(page.url.searchParams.get('returnUrl') ?? undefined);

    const extraInfo: HintInfo = $derived.by(() => {
        let hint = page.url.searchParams.get('hint');
        let errorType = page.url.searchParams.get('errorType');

        if (hint) {
            switch (hint as Hint) {
                case 'login-expired':
                    return {
                        longHint: locale.t('login.infoLoginExpired'),
                        shortHint: locale.t('login.infoLoginExpiredShort'),
                        allowGuest: true
                    };
                case 'email-confirm':
                    return {
                        longHint: locale.t('login.infoEmailConfirm'),
                        shortHint: locale.t('login.infoEmailConfirmShort'),
                        allowGuest: false
                    };
                case 'email-change':
                    return {
                        longHint: locale.t('login.infoEmailChange'),
                        shortHint: locale.t('login.infoEmailChangeShort'),
                        allowGuest: false
                    };
            }
        }
        if (errorType) {
            switch (errorType as ErrorType) {
                case 'auth-login-required':
                    return {
                        longHint: locale.t('login.signInTitle'),
                        shortHint: locale.t('login.signInShort'),
                        allowGuest: true
                    };
            }
        }

        return {
            longHint: locale.t('login.signInTitle'),
            shortHint: locale.t('login.signInShort'),
            allowGuest: true
        };
    });

    // see issue: https://github.com/sveltejs/kit/issues/15200
    const providersQuery = queryExternalLoginProviders();
    const currentUserQuery = queryCurrentUserInfo();

    const redirectUrlQuery = $derived(querySanitizedReturnUrl(returnUrl));
    const backgroundUrls = $derived(queryAssetUrls(['loginBackground', 'loginBackground_alt']));
    const backgroundBrightUrls = $derived(queryAssetUrls(['loginBackgroundBright', 'loginBackgroundBright_alt']));

    const skipCaptcha = import.meta.env.VITE_SKIP_CAPTCHA;

    let isRedirecting = $state(false);
    let captcha = $state(skipCaptcha ? CAPTCHA_SKIP_TOKEN : '');
    let rememberMe = $state(true);
    let guestAreaRef = $state<HTMLDivElement | undefined>();

    let waitLoading = $state(true);

    $effect(() => {
        // Brief delay to avoid flickering if resources load quickly
        async.delay(500).then(() => (waitLoading = false));
    });

    // Show loading when:
    // - There is no error, in which case an error card is shown
    // - Initial load (waitLoading)
    // - No captcha yet, or captcha is refreshing (for interactive login)
    // - Currently redirecting
    // - Some async effect is pending (like fetching user info or login providers)
    // - Boundary is pending (awaiting content to load)
    const showLoading = $derived(isRedirecting || waitLoading || (prompt && !captcha));

    // Disable buttons when:
    // - Login is submitted to prevent multiple submissions
    // - Currently redirecting
    // - If captcha is not solved yet or expired
    const disableButtons = $derived(isRedirecting || !captcha);

    // Resolve the redirect target from a single consistent snapshot of the queries.
    const nonInteractiveTarget = $derived.by(async () => {
        if (prompt) return undefined;

        const user = await currentUserQuery;
        const sanitizedUrl = await redirectUrlQuery;

        if (user.authenticated) {
            logUser.log(`Redirecting user with an active session to ${sanitizedUrl}`);
            return sanitizedUrl;
        }

        // if we have no authenticated user, try the token flow that will either
        // - authenticate and redirect the user to the target url
        // - or fail and redirect the user to the login page with a prompt
        logUser.log(`Trying the remember me token with returnUrl [${returnUrl}]`);
        const errorUrl = `/login?${new URLSearchParams({ ...(returnUrl ? { returnUrl } : {}), prompt: 'true' })}`;
        return authPages.tokenLoginUrl({ redirectUrl: sanitizedUrl, errorUrl });
    });

    $effect(() => {
        if (isRedirecting || prompt) return;
        logUser.log(`Starting non-interactive login flow with returnUrl [${returnUrl}]`);

        nonInteractiveTarget.then((target) => {
            if (isRedirecting || !target) return;
            isRedirecting = true;
            window.location.replace(target);
        });
    });
</script>

<CenteredLayout padding={0}>
    <svelte:boundary>
        {#snippet pending()}
            {#if backgroundUrls.ready}
                <Overlay src={Object.values(backgroundUrls.current)} opacity={0.25} />
                {#if backgroundBrightUrls.ready}
                    <MovingBlob
                        src={Object.values(backgroundBrightUrls.current)}
                        size={{ xs: 100, lg: 150, xl: 250 }}
                        excludedElement={guestAreaRef}
                    />
                {/if}
            {/if}
            <LoadingCard label={locale.t('common.loading')} />
        {/snippet}

        {#snippet failed(error, reset)}
            {#if isRedirecting}
                <!-- A redirect (e.g. non-interactive token login) aborts in-flight fetches; Firefox surfaces
                     these as a NetworkError that would otherwise flash an error card while navigating away. -->
                <LoadingCard label={locale.t('common.loading')} />
            {:else}
                <ErrorCard error={createAppError(error)}>
                    {#snippet actions()}
                        <Button
                            onclick={() => {
                                reset();
                                providersQuery.refresh();
                                currentUserQuery.refresh();
                            }}
                        >
                            {locale.t('common.retry')}
                        </Button>
                    {/snippet}
                </ErrorCard>
            {/if}
        {/snippet}

        <Overlay src={Object.values(await backgroundUrls)} opacity={0.25} />
        <!-- {#if !showLoading} -->
        <MovingBlob
            src={Object.values(await backgroundBrightUrls)}
            size={{ xs: 100, lg: 150, xl: 250 }}
            excludedElement={guestAreaRef}
        />
        <!-- {/if} -->

        <Stack spacing={0} class="relative w-full h-full p-2">
            <Logo class="justify-center h-[20%] w-auto flex items-center fill-on-container p-2 pb-0" />

            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1} class="h-[80%]">
                <div class="items-center justify-center hidden p-8 max-h-[min(100%,40rem)] lg:flex lg:flex-4">
                    <Typography variant="h4" element="h1">
                        {extraInfo.longHint}
                    </Typography>
                </div>

                <Stack
                    spacing={0}
                    justification="evenly"
                    class="h-[80%] w-fit mx-auto px-2 lg:h-full lg:w-auto lg:mx-0 lg:flex-3 lg:max-w-92 max-h-[min(100%,40rem)]"
                >
                    <Typography variant="h4" element="h1" class="flex justify-center flex-1 p-2 min-h-fit lg:hidden">
                        {extraInfo.shortHint}
                    </Typography>
                    <Stack spacing={0} class="w-full min-h-0 p-2 grow max-h-fit">
                        {@const user = await currentUserQuery}
                        {#if user.authenticated}
                            <Stack class="shrink" spacing={4}>
                                <Button
                                    wide
                                    color="secondary"
                                    size="lg"
                                    disabled={disableButtons}
                                    class="drop-shadow-on-secondary drop-shadow-md"
                                    href={await redirectUrlQuery}
                                >
                                    <allBrands.user size="sm" />
                                    {locale.t('login.continueAs', { name: user.name })}
                                </Button>
                                <div
                                    class="relative w-full h-0.5 bg-linear-to-r from-transparent via-on-container to-transparent lg:w-[160%] lg:left-[-10%]"
                                ></div>
                                <Typography variant="text" class="text-center shrink-0">
                                    {locale.t('login.switchAccount')}
                                </Typography>
                            </Stack>
                        {/if}
                        <Box
                            border={false}
                            ghost={true}
                            scrollShadow
                            containerClass="w-full flex-1 px-4"
                            contentClass="flex flex-col gap-2"
                        >
                            {#each await providersQuery as provider (provider)}
                                <Button
                                    wide
                                    color="primary"
                                    disabled={disableButtons}
                                    href={authPages.externalLoginUrl(provider, {
                                        captcha,
                                        rememberMe,
                                        redirectUrl: await redirectUrlQuery
                                    })}
                                >
                                    {@const ProviderIcon = allBrands[provider]}
                                    {#if ProviderIcon}
                                        <ProviderIcon size="sm" />
                                    {/if}
                                    {pascalCase(provider)}
                                </Button>
                            {/each}
                            <EmailLoginButton disabled={disableButtons} {captcha} {rememberMe} />
                        </Box>
                        <Stack direction="row" alignment="center" justification="start" class="px-8 py-2 shrink">
                            <Switch bind:checked={rememberMe} id="rememberMe" />
                            <Typography variant="h5" element="label" for="rememberMe"
                                >{locale.t('login.rememberMe')}</Typography
                            >
                        </Stack>
                    </Stack>
                </Stack>

                <div
                    class="block w-full h-0.5 bg-linear-to-r from-transparent via-on-container to-transparent lg:hidden"
                ></div>
                <div
                    class="hidden relative top-[-10%] w-0.5 h-[110%] bg-linear-to-b from-transparent via-on-container to-transparent lg:block"
                ></div>

                <div
                    bind:this={guestAreaRef}
                    class="flex items-center justify-center p-3 flex-2 lg:max-w-96 min-h-fit lg:px-2 backdrop-saturate-90"
                >
                    <Button
                        wide
                        color="primary"
                        disabled={disableButtons}
                        href={authPages.guestLoginUrl({ captcha, redirectUrl: await redirectUrlQuery })}
                        >{locale.t('login.continueAsGuest')}</Button
                    >
                </div>
            </Stack>
        </Stack>

        <Dialog width="fit" open={showLoading} contentClass="flex flex-col items-center justify-center">
            <LoadingCard variant="ghost" label={locale.t('login.waitingServer')} />
            {#if prompt && !skipCaptcha}
                <!-- Load captcha only for interactive login -->
                <Turnstile
                    siteKey={config.turnstile.siteKey}
                    size="normal"
                    theme={theme.current}
                    onToken={(t) => (captcha = t)}
                />
            {/if}
        </Dialog>
    </svelte:boundary>
</CenteredLayout>
