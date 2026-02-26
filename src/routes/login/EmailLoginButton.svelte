<script module lang="ts">
    import { z } from 'zod';
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
        onSubmit: () => void;
    };
    const emailSchema = z.email({ message: createTr('login.emailInvalidError') });
</script>

<script lang="ts">
    let { disabled, captcha, rememberMe, onSubmit }: EmailLoginButtonProps = $props();

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
    <form method="POST" action="/api/auth/email/login" data-sveltekit-reload onsubmit={() => onSubmit()}>
        <input type="hidden" name="email" value={validatedEmail || ''} />
        <input type="hidden" name="rememberMe" value={rememberMe} />
        <input type="hidden" name="captcha" value={captcha} />
        <!-- Encoding some temp url seems not to be a good idea, so we fall back to the default by not providing any redirectUrl -->
        <!-- <input type="hidden" name="redirectUrl" value="/game" /> -->

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
                <Button type="button" onclick={() => (isOpen = false)}>
                    {locale.t('login.emailCancelButton')}
                </Button>
                <Button type="submit" color="secondary" disabled={submitDisabled}>
                    {locale.t('login.emailSubmitButton')}
                </Button>
            </Stack>
        </Stack>
    </form>
</Dialog>
