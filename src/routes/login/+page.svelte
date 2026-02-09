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
    import { queryExternalLoginProviders } from '@lib/account/login.remote';
    import { queryAssetUrls } from '@lib/assets/assets.remote';
    import { t } from '@lib/i18n/i18n.svelte';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Overlay from '@lib/ui/atoms/Overlay.svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Logo from '@lib/ui/atoms/glyphs/Logo.svelte';
    import Discord from '@lib/ui/atoms/glyphs/brands/Discord.svelte';
    import Email from '@lib/ui/atoms/glyphs/brands/Email.svelte';
    import Github from '@lib/ui/atoms/glyphs/brands/Github.svelte';
    import Google from '@lib/ui/atoms/glyphs/brands/Google.svelte';
    import User from '@lib/ui/atoms/glyphs/brands/User.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';
    import LoadingCard from '@lib/ui/components/cards/LoadingCard.svelte';
    import { createAppError } from '@lib/utils';

    //const prompt = $derived(page.url.searchParams.get('prompt'));
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
                    loginText: 'Sign in',
                    allowGuest: true
                };
        }
    });

    // const returnUrl = async () => {
    //     const rawUrl = page.url.searchParams.get('returnUrl') ?? '';
    //     const target = decodeURIComponent(rawUrl) ?? '/game';
    //     const sanitizedURL = querySanitizedReturnUrl(target).current;
    //     if (sanitizedURL) {
    //         logUser.log(`Sanitized returnUrl: [${sanitizedURL}]`);
    //     }
    //     return sanitizedURL;
    // };

    const providers = queryExternalLoginProviders();
    const currentUser = queryCurrentUserInfo();
    const backgroundUrls = queryAssetUrls(['loginBackground', 'loginBackground_alt']);
    const backgroundBrightUrls = queryAssetUrls(['loginBackgroundBright', 'loginBackgroundBright_alt']);

    // Split backgrounds: bg1 for full screen, bg2 for card area
    const bg1 = $derived(Object.values(await backgroundUrls));
    const bg2 = $derived(Object.values(await backgroundBrightUrls));

    const hasCaptcha = !config.turnstile.disable;
    if (!hasCaptcha) {
        console.warn('Captcha is disabled');
    }

    // when captcha is disabled use a test (site) key that always passes the server side validation
    //let captcha = $state(hasCaptcha ? '' : '1x00000000000000000000AA');
    //let rememberMe = $state(true);

    //let waitLoading = $state(true);
    //const showLoading = $derived(waitLoading || !captcha || !returnUrl);
</script>

<CenteredLayout class="p-0 md:p-0">
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

        <!-- Full screen background (bg1) -->
        <Overlay src={bg1} opacity={0.25} fixed={true} />

        <!-- Login<br />
        {await returnUrl()} <br />
        {JSON.stringify(await providers)} <br />
        {JSON.stringify(await currentUser)} <br />
        {JSON.stringify(await backgroundUrls)} <br />
        prompt: {prompt} <br />
        extraInfo: {JSON.stringify(extraInfo)} <br />
        captcha: {captcha} <br />
        rememberMe: {rememberMe} <br />
        showLoading: {showLoading} <br /> -->

        <Stack spacing={{ xs: 0 }} alignment="center" class="w-full h-full">
            <Logo class="max-h-[20%] w-auto fill-on-container p-2" />

            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={{ xs: 2 }}
                alignment="center"
                class="w-full min-h-[60%] grow"
            >
                <!-- Login Hint Area
                <div class="hidden lg:flex flex-1 items-center justify-center p-8">
                    {#if extraInfo.loginText}
                        <Typography variant="h3" class="text-center max-w-md">
                            {extraInfo.loginText}
                        </Typography>
                    {:else}
                        <Stack spacing={2} alignment="center">
                            <Typography variant="h2" class="text-center">Welcome to Shine</Typography>
                            <Typography variant="h5" class="text-center opacity-80">
                                Sign in with your preferred provider
                            </Typography>
                        </Stack>
                    {/if}
                </div> -->

                {#if extraInfo.loginText}
                    <Typography variant="text" class="text-center">
                        {extraInfo.loginText}
                    </Typography>
                {/if}

                <!-- Container for Box with its own background (bg2) -->
                <div class="relative flex-1 flex items-center justify-center rounded-3xl px-40">
                    <Box
                        ghost={true}
                        border={false}
                        containerClass="rounded-3xl align-self-center flex-1 relative z-10"
                        contentClass="p-3 flex flex-col h-full"
                    >
                        <Stack spacing={2} class="shrink-0">
                            <Button wide size="lg">
                                <User />
                                Continue as FreeUser
                            </Button>
                            <Typography variant="text" class="text-center">Not you? Switch account</Typography>
                        </Stack>
                        <hr />

                        <Box border={false} ghost={true} width="full" contentClass="p-0 pe-2 overflow-y-auto min-h-0">
                            <Stack spacing={2}>
                                <Button wide>
                                    <Email size="sm" />
                                    Email
                                </Button>

                                <Button wide>
                                    <Discord size="sm" />
                                    Discord
                                </Button>

                                <Button wide>
                                    <Github size="sm" />
                                    Github
                                </Button>

                                <Button wide>
                                    <Google size="sm" />
                                    Google
                                </Button>

                                <Button wide>
                                    <Google size="sm" />
                                    Google
                                </Button>
                            </Stack>
                        </Box>
                        <Typography class="text-slate-800 font-medium cursor-pointer">Remember me</Typography>
                    </Box>
                    <div
                        class="absolute top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat bg-fixed pointer-events-none z-20"
                        style="background-image: {bg2
                            .map((url) => `url(${url})`)
                            .join(
                                ','
                            )}; opacity: 0.3; mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%); -webkit-mask-image: radial-gradient(ellipse at center, black 60%, transparent 70%);"
                    ></div>
                </div>
                <hr class="w-full md:hidden" />
                <div class="relative w-full flex justify-center items-center p-3 h-[15%]">
                    <Button variant="outline">Explore as Guest</Button>
                </div>
            </Stack>
        </Stack>

        <!-- <a href="/account">Go to Login Page</a> -->
    </svelte:boundary>
</CenteredLayout>
