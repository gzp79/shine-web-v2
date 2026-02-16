<script module lang="ts">
    export type HintInfo = {
        longHint?: string;
        shortHint?: string;
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
    import { getThemeContext } from '@lib/theme/theme.svelte';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Overlay from '@lib/ui/atoms/Overlay.svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Logo from '@lib/ui/atoms/glyphs/Logo.svelte';
    import allBrands from '@lib/ui/atoms/glyphs/brands/all';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';
    import Dialog from '@lib/ui/atoms/layouts/Dialog.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';
    import LoadingCard from '@lib/ui/components/cards/LoadingCard.svelte';
    import Turnstile from '@lib/ui/components/forms/Turnstile.svelte';
    import { async, createAppError } from '@lib/utils';
    import MovingBlob from './MovingBlob.svelte';

    let theme = getThemeContext();

    const prompt = $derived(!!page.url.searchParams.get('prompt'));
    const returnUrl = $derived(page.url.searchParams.get('returnUrl') ?? undefined);

    const extraInfo: HintInfo = $derived.by(() => {
        let hint = page.url.searchParams.get('hint') || '';
        switch (hint) {
            case 'login-expired':
                return {
                    longHint: $t('login.info.loginExpired'),
                    shortHint: $t('login.info.loginExpiredShort'),
                    allowGuest: true
                };
            case 'email-confirm':
                return {
                    longHint: $t('login.info.emailConfirm'),
                    shortHint: $t('login.info.emailConfirmShort'),
                    allowGuest: false
                };
            case 'email-change':
                return {
                    longHint: $t('login.info.emailChange'),
                    shortHint: $t('login.info.emailChangeShort'),
                    allowGuest: false
                };
            default:
                return {
                    longHint: 'Sign in to your account',
                    shortHint: 'Sign in',
                    allowGuest: true
                };
        }
    });

    //const currentUser = $derived(queryCurrentUserInfo());
    //const providers = $derived(queryExternalLoginProviders());
    const backgroundUrls = $derived(queryAssetUrls(['loginBackground', 'loginBackground_alt']));
    const backgroundBrightUrls = $derived(queryAssetUrls(['loginBackgroundBright', 'loginBackgroundBright_alt']));

    let isRedirecting = $state(false);
    let isError = $state(false);
    let captcha = $state('');
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
    const showLoading = $derived(!isError && (isRedirecting || waitLoading || (prompt && !captcha)));

    $effect(() => {
        (async () => {
            if (!prompt) {
                isRedirecting = true;
                logUser.log(`Starting non-interactive login flow with returnUrl [${returnUrl}]`);
                const user = await queryCurrentUserInfo();
                if (user.authenticated) {
                    const url = await querySanitizedReturnUrl(returnUrl);
                    logUser.log(`Redirecting user with an active session to ${url}`);
                    window.location.href = url;
                } else {
                    // if we have no authenticated user, try the token flow that will either
                    // - authenticate and redirect the user to the target url
                    // - or fail and redirect the user to the login page with a prompt
                    logUser.log(`Trying the remember me token with returnUrl [${returnUrl}]`);
                    const queryString = returnUrl ? `?${new URLSearchParams({ returnUrl })}` : '';
                    window.location.href = `api/auth/token/login${queryString}`;
                }
            }
        })();
    });
</script>

<CenteredLayout padding={0}>
    <svelte:boundary
        onerror={() => {
            isError = true;
        }}
    >
        {#snippet pending()}
            {console.log('pending', Date.now())}
            {#if backgroundUrls.ready}
                <Overlay src={Object.values(backgroundUrls.current)} opacity={0.25} />
            {/if}
        {/snippet}

        {#snippet failed(error, reset)}
            <ErrorCard error={createAppError(error)} width="full">
                {#snippet actions()}
                    <Button
                        onclick={async () => {
                            await queryCurrentUserInfo().refresh();
                            await queryExternalLoginProviders().refresh();
                            isError = false;
                            reset();
                        }}
                    >
                        {$t('common.retry')}
                    </Button>
                {/snippet}
            </ErrorCard>
        {/snippet}

        {console.log('core', Date.now())}
        <Overlay src={Object.values(await backgroundUrls)} opacity={0.25} />
        {#if !showLoading}
            <MovingBlob
                src={Object.values(await backgroundBrightUrls)}
                size={{ xs: 100, lg: 150, xl: 250 }}
                excludedElement={guestAreaRef}
            />
        {/if}

        <Stack spacing={0} class="relative w-full h-full p-2">
            <Logo class="justify-center h-[20%] w-auto flex items-center fill-on-container p-4" />

            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1} class="h-[80%]">
                <div class="hidden p-8 lg:flex lg:flex-4">
                    <Typography variant="h4" element="h1">
                        {extraInfo.longHint}
                    </Typography>
                </div>

                <Stack
                    spacing={0}
                    justification="evenly"
                    class="h-[80%] w-fit mx-auto p-2 lg:h-full lg:w-auto lg:mx-0 lg:flex-2 lg:max-w-92 max-h-[min(100%,60vh)]"
                >
                    <Typography variant="h4" element="h1" class="flex justify-center flex-1 p-2 min-h-fit lg:hidden">
                        {extraInfo.shortHint}
                    </Typography>
                    <Stack spacing={0} class="w-full min-h-0 p-2 grow max-h-fit">
                        {@const user = await queryCurrentUserInfo()}
                        {#if user.authenticated}
                            <Stack class="shrink">
                                <Button wide color="secondary" size="lg">
                                    <allBrands.user />
                                    Continue as {user.name}
                                </Button>
                                <Typography variant="text" class="text-center shrink-0"
                                    >Not you? Switch account</Typography
                                >
                            </Stack>
                        {/if}
                        <Box
                            border={false}
                            ghost={true}
                            scrollShadow
                            containerClass="w-full flex-1"
                            contentClass="flex flex-col gap-2"
                        >
                            {#each await queryExternalLoginProviders() as provider (provider)}
                                <form method="GET" action="/api/auth/{provider}/login">
                                    <input type="hidden" name="rememberMe" value={rememberMe} />
                                    <input type="hidden" name="captcha" value={captcha} />
                                    <input type="hidden" name="redirectUrl" value={returnUrl} />

                                    <Button wide color="secondary" type="submit">
                                        {@const ProviderIcon = allBrands[provider]}
                                        {#if ProviderIcon}
                                            <ProviderIcon size="sm" />
                                        {/if}
                                        {provider}
                                    </Button>
                                </form>
                            {/each}
                        </Box>
                        <Typography variant="h5" element="h1" class="flex justify-start p-4 shrink">
                            Remember me
                        </Typography>
                    </Stack>
                </Stack>

                <div class="hidden w-px bg-gray-300 lg:block"></div>

                <hr class="lg:hidden" />

                <div class="w-px bg-[white] hidden lg:block"></div>

                <div
                    bind:this={guestAreaRef}
                    class="flex items-center justify-center flex-1 p-3 min-h-fit lg:px-2 backdrop-saturate-90"
                >
                    <form method="GET" action="/api/auth/guest/login">
                        <input type="hidden" name="captcha" value={captcha} />
                        <input type="hidden" name="redirectUrl" value={returnUrl} />
                        <Button type="submit">Continue as Guest</Button>
                    </form>
                </div>
            </Stack>
        </Stack>
    </svelte:boundary>

    {console.log('dialog', Date.now())}
    <Dialog width="fit" open={showLoading} contentClass="flex flex-col items-center justify-center">
        <LoadingCard variant="ghost" label="Waiting server" />
        {#if prompt}
            <!-- Show captcha only for interactive login -->
            <Turnstile siteKey={config.turnstile.siteKey} size="normal" theme={theme.current} bind:token={captcha} />
        {/if}
    </Dialog>
</CenteredLayout>
