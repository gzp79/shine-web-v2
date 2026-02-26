<script module lang="ts">
    import type { AppError } from '@lib/utils';

    export type EmailConfirmButtonVariant = 'change' | 'confirmOrChange';

    export type EmailConfirmButtonProps = {
        variant: EmailConfirmButtonVariant;
        disabled?: boolean;
        onerror?: (error: AppError) => void;
    };
</script>

<script lang="ts">
    import { z } from 'zod';
    import { getLocaleContext } from '@lib/i18n';
    import { logAPI } from '@lib/loggers';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Spinner from '@lib/ui/atoms/icons/animated/Spinner.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Dialog from '@lib/ui/atoms/layouts/Dialog.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import ComboButton from '@lib/ui/components/buttons/ComboButton.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';
    import ZodField from '@lib/ui/components/forms/ZodField.svelte';
    import { createAppError } from '@lib/utils';
    import { startEmailChange, startEmailConfirmation } from './auth.remote';

    let { variant, disabled = false, onerror }: EmailConfirmButtonProps = $props();

    const locale = getLocaleContext();

    // State machine
    let emailOp = $state<'confirm' | 'change' | null>(null);
    let emailStatus = $state<'gettingNewEmail' | 'waitingResponse' | 'completed' | AppError | null>(null);
    let emailSent = $state(false);
    let validatedEmail = $state<string | undefined>(undefined);

    // Derived state
    let isEmailValid = $derived(!!validatedEmail);
    let isModalOpen = $derived(emailStatus !== null);
    let effectiveVariant = $derived(emailSent ? 'change' : variant);

    // Type guard for error state
    function isAppError(status: typeof emailStatus): status is AppError {
        return status instanceof Error;
    }

    // Close dialog when disabled
    $effect(() => {
        if (disabled) {
            emailStatus = null;
        }
    });

    const startConfirm = async () => {
        emailOp = 'confirm';
        emailStatus = 'waitingResponse';
        try {
            await startEmailConfirmation();
            emailStatus = 'completed';
        } catch (e) {
            const appError = createAppError(e);
            logAPI.error('Failed to start email confirmation', appError);
            emailStatus = appError;
            onerror?.(appError);
        }
    };

    const startChange = () => {
        emailOp = 'change';
        emailStatus = 'gettingNewEmail';
        validatedEmail = undefined;
    };

    const submitEmailChange = async () => {
        if (!validatedEmail) return;
        emailStatus = 'waitingResponse';
        try {
            await startEmailChange(validatedEmail);
            emailStatus = 'completed';
        } catch (e) {
            const appError = createAppError(e);
            logAPI.error('Failed to start email change', appError);
            emailStatus = appError;
            onerror?.(appError);
        }
    };

    const cancelEmailChange = () => {
        emailStatus = null;
        emailOp = null;
        validatedEmail = undefined;
    };

    const finishEmailOperation = () => {
        emailStatus = null;
        emailSent = true;
        emailOp = null;
        validatedEmail = undefined;
    };

    const retryEmailOperation = () => {
        if (emailOp === 'confirm') {
            startConfirm();
        } else if (emailOp === 'change') {
            submitEmailChange();
        }
    };
</script>

{#if emailSent}
    <Typography variant="footnote">
        {locale.t('login.emailModalTitle')}
    </Typography>
{:else if effectiveVariant === 'change'}
    <Button size="sm" {disabled} onclick={startChange}>
        {locale.t('account.emailChangeTitle')}
    </Button>
{:else}
    <ComboButton
        size="sm"
        {disabled}
        options={[
            {
                caption: locale.t('account.emailConfirmTitle'),
                onclick: startConfirm
            },
            {
                caption: locale.t('account.emailChangeTitle'),
                onclick: startChange
            }
        ]}
    />
{/if}

<Dialog
    bind:open={isModalOpen}
    width="sm"
    title={locale.t(`account.${emailOp === 'confirm' ? 'emailConfirm' : 'emailChange'}Title`)}
>
    {#if emailStatus === 'waitingResponse'}
        <Stack spacing={4} alignment="end">
            <Typography variant="text" class="w-full text-justify">
                {locale.t(`account.${emailOp === 'confirm' ? 'emailConfirm' : 'emailChange'}Waiting`)}
            </Typography>
            <Button disabled>
                <Spinner />
                {locale.t('common.ok')}
            </Button>
        </Stack>
    {:else if emailStatus === 'gettingNewEmail'}
        <Stack spacing={4}>
            <ZodField
                type="email"
                schema={z.email()}
                onValue={(val) => (validatedEmail = val)}
                placeholder={locale.t('account.emailChangeNewEmail')}
                required
                wide
            />
            <Stack direction="row" spacing={1} justification="end">
                <Button onclick={cancelEmailChange}>
                    {locale.t('common.cancel')}
                </Button>
                <Button color="secondary" disabled={!isEmailValid} onclick={submitEmailChange}>
                    {locale.t('common.update')}
                </Button>
            </Stack>
        </Stack>
    {:else if isAppError(emailStatus)}
        <ErrorCard error={emailStatus} width="full">
            {#snippet actions()}
                <Stack direction="row" spacing={1} justification="end">
                    <Button onclick={cancelEmailChange}>
                        {locale.t('common.cancel')}
                    </Button>
                    <Button color="secondary" onclick={retryEmailOperation}>
                        {locale.t('common.retry')}
                    </Button>
                </Stack>
            {/snippet}
        </ErrorCard>
    {:else if emailStatus === 'completed'}
        <Stack spacing={4} alignment="end">
            <Typography variant="text" class="w-full text-justify">
                {locale.t(`account.${emailOp === 'confirm' ? 'emailConfirm' : 'emailChange'}Completed`)}
            </Typography>
            <Button onclick={finishEmailOperation}>
                {locale.t('common.ok')}
            </Button>
        </Stack>
    {/if}
</Dialog>
