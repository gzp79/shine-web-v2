<script module lang="ts">
    import { authPages } from '@lib/api/authPages';
    import { getLocaleContext } from '@lib/i18n';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Field from '@lib/ui/atoms/input/Field.svelte';
    import Input from '@lib/ui/atoms/input/Input.svelte';
    import Card from '@lib/ui/atoms/layouts/Card.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import ConfirmationButton from '@lib/ui/components/buttons/ConfirmationButton.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';
    import LoadingCard from '@lib/ui/components/cards/LoadingCard.svelte';
    import { createAppError } from '@lib/utils';
    import { queryCurrentUserInfo } from './auth.remote';
</script>

<script lang="ts">
    const userInfo = queryCurrentUserInfo();
    const locale = getLocaleContext();

    let confirmationInput = $state('');
    const deleteUrl = $derived(
        authPages.deleteUserUrl({ redirectUrl: '/public/account-deleted', confirmation: confirmationInput })
    );
</script>

<Card color="danger" width="md" title={locale.t('account.dangerZoneTitle')}>
    <svelte:boundary>
        {#snippet pending()}
            <Stack class="items-center">
                <LoadingCard variant="ghost" />
            </Stack>
        {/snippet}

        {#snippet failed(error, reset)}
            <ErrorCard error={createAppError(error)} width="full">
                {#snippet actions()}
                    <Button
                        onclick={async () => {
                            await userInfo.refresh();
                            reset();
                        }}
                    >
                        {locale.t('common.retry')}
                    </Button>
                {/snippet}
            </ErrorCard>
        {/snippet}

        {@const user = await userInfo}
        {#if user.authenticated}
            {@const userName = user.name}
            <Stack spacing={4}>
                <Typography variant="text">
                    {locale.t('account.dangerZoneWarning')}
                </Typography>

                <Field label={locale.t('account.deleteConfirmLabel', { name: userName })}>
                    <Stack direction="row" spacing={2}>
                        <Input wide bind:value={confirmationInput} placeholder={userName} />
                        <ConfirmationButton
                            color="danger"
                            disabled={confirmationInput !== userName || userName === ''}
                            confirmation={{
                                title: locale.t('account.deleteConfirmationTitle'),
                                question: locale.t('account.deleteConfirmationQuestion'),
                                confirm: locale.t('account.deleteConfirmationConfirmText'),
                                cancel: locale.t('account.deleteConfirmationCancelText'),
                                color: 'danger'
                            }}
                            confirmAction={{ href: deleteUrl }}
                        >
                            {locale.t('account.deleteButton')}
                        </ConfirmationButton>
                    </Stack>
                </Field>
            </Stack>
        {/if}
    </svelte:boundary>
</Card>
