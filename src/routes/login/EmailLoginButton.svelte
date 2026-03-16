<script module lang="ts">
    import { z } from 'zod';
    import { authPages } from '@lib/api/authPages';
    import { createTr, getLocaleContext } from '@lib/i18n';
    import allBrands from '@lib/ui/atoms/glyphs/brands/all';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Dialog from '@lib/ui/atoms/layouts/Dialog.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import ZodField from '@lib/ui/components/forms/ZodField.svelte';

    export type EmailLoginButtonProps = {
        disabled: boolean;
        captcha: string;
        rememberMe: boolean;
    };
    const emailSchema = z.email({ message: createTr('login.emailInvalidError') });
</script>

<script lang="ts">
    let { disabled, captcha, rememberMe }: EmailLoginButtonProps = $props();

    let locale = getLocaleContext();

    // User intent to open dialog
    let isOpen = $state(false);
    let validatedEmail = $state<string | undefined>(undefined);

    const submitDisabled = $derived(!validatedEmail || disabled);

    $effect(() => {
        if (disabled) {
            isOpen = false;
        }
    });
</script>

<Button wide color="primary" {disabled} onclick={() => (isOpen = true)}>
    {@const EmailIcon = allBrands.email}
    {#if EmailIcon}
        <EmailIcon size="sm" />
    {/if}
    {locale.t('login.emailButton')}
</Button>

<Dialog bind:open={isOpen} width="fit" title={locale.t('login.emailDialogTitle')} closeIcon>
    <Stack spacing={4}>
        <ZodField
            type="email"
            schema={emailSchema}
            onValue={(val) => (validatedEmail = val)}
            placeholder={locale.t('login.emailInputDescription')}
            required
            wide
        />

        <Stack direction="row" spacing={2} justification="end">
            <Button onclick={() => (isOpen = false)}>
                {locale.t('login.emailCancelButton')}
            </Button>
            <Button
                color="secondary"
                disabled={submitDisabled}
                href={authPages.emailLoginUrl({
                    email: validatedEmail || '',
                    rememberMe,
                    captcha,
                    redirectUrl: '/public/email-login'
                })}
            >
                {locale.t('login.emailSubmitButton')}
            </Button>
        </Stack>
    </Stack>
</Dialog>
