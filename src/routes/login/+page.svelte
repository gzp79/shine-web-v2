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

    //const prompt = $derived(page.url.searchParams.get('prompt'));
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

    let theme = getThemeContext();

    const returnUrl = async (): Promise<string> => {
        const rawUrl = page.url.searchParams.get('returnUrl') ?? '';
        const target = decodeURIComponent(rawUrl) ?? '/game';
        const sanitizedURL = await querySanitizedReturnUrl(target);
        logUser.log(`Sanitized returnUrl: [${sanitizedURL}]`);
        return sanitizedURL;
    };

    const providers = queryExternalLoginProviders();
    const currentUser = queryCurrentUserInfo();
    const backgroundUrls = queryAssetUrls(['loginBackground', 'loginBackground_alt']);
    const backgroundBrightUrls = queryAssetUrls(['loginBackgroundBright', 'loginBackgroundBright_alt']);

    // when captcha is disabled use a test (site) key that always passes the server side validation
    let captcha = $state('');
    let rememberMe = $state(true);
    let guestAreaRef: HTMLDivElement | undefined = $state();

    let waitLoading = $state(true);
    $effect(() => {
        async.delay(5000).then(() => (waitLoading = false));
    });
    const showLoading = $derived(waitLoading || !captcha || $effect.pending());
</script>

<CenteredLayout padding={0}>
    <svelte:boundary>
        {#snippet pending()}
            {#if backgroundUrls.current}
                <Overlay src={Object.values(backgroundUrls.current)} opacity={0.25} />
            {/if}
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
                        {@const user = await currentUser}
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
                            containerClass="w-full flex-1"
                            contentClass="flex flex-col gap-2"
                        >
                            {#each await providers as provider (provider)}
                                <form method="GET" action="/api/auth/{provider}/login">
                                    <input type="hidden" name="rememberMe" value={rememberMe} />
                                    <input type="hidden" name="captcha" value={captcha} />
                                    <input type="hidden" name="redirectUrl" value={await returnUrl()} />

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
                        <input type="hidden" name="redirectUrl" value={await returnUrl()} />
                        <Button type="submit">Continue as Guest</Button>
                    </form>
                </div>
            </Stack>
        </Stack>
    </svelte:boundary>

    <Dialog width="fit" open={showLoading} contentClass="flex flex-col items-center justify-center">
        <LoadingCard variant="ghost" label="Waiting server" />
        <Turnstile siteKey={config.turnstile.siteKey} size="normal" theme={theme.current} bind:token={captcha} />
    </Dialog>
</CenteredLayout>
