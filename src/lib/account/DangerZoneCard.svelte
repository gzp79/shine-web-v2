<script module lang="ts">
    import { getAuthenticatedUserContext } from '#lib/account/authContext.svelte';
    import { authPages } from '#lib/api/authPages';
    import { getLocaleContext } from '#lib/i18n';
    import Typography from '#lib/ui/atoms/Typography.svelte';
    import Field from '#lib/ui/atoms/input/Field.svelte';
    import Input from '#lib/ui/atoms/input/Input.svelte';
    import Card from '#lib/ui/atoms/layouts/Card.svelte';
    import Stack from '#lib/ui/atoms/layouts/Stack.svelte';
    import ConfirmationButton from '#lib/ui/components/buttons/ConfirmationButton.svelte';
</script>

<script lang="ts">
    const currentUser = getAuthenticatedUserContext();
    const userName = $derived(currentUser.user.name);
    const locale = getLocaleContext();

    let confirmationInput = $state('');
    let revalidating = $state(false);
    const deleteUrl = $derived(
        authPages.deleteUserUrl({ redirectUrl: '/public/account-deleted', confirmation: confirmationInput })
    );

    // Deleting the account is irreversible, so revalidate the session at the last possible moment
    // rather than trusting the copy this page was rendered from. A `false` means the guard is
    // already on its way to login; there is nothing to report here, just nothing left to do.
    const deleteAccount = async () => {
        revalidating = true;
        try {
            if (!(await currentUser.revalidateSession())) return;
            window.location.href = deleteUrl;
        } finally {
            revalidating = false;
        }
    };
</script>

<Card color="danger" width="md" title={locale.t('account.dangerZoneTitle')}>
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
                    confirmAction={{ onclick: deleteAccount, disabled: revalidating || currentUser.loading }}
                >
                    {locale.t('account.deleteButton')}
                </ConfirmationButton>
            </Stack>
        </Field>
    </Stack>
</Card>
