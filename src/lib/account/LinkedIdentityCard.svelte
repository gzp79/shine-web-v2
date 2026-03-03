<script module lang="ts">
    import { getLocaleContext } from '@lib/i18n';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Card from '@lib/ui/atoms/layouts/Card.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';
    import LoadingCard from '@lib/ui/components/cards/LoadingCard.svelte';
    import { type AppError, createAppError } from '@lib/utils';
    import AddLinkButton from './AddLinkButton.svelte';
    import LinkedIdentityItem from './LinkedIdentityItem.svelte';
    import { queryLinkedIdentities, unlinkIdentity as unlinkIdentityCommand } from './auth.remote';
</script>

<script lang="ts">
    const identities = queryLinkedIdentities();
    const locale = getLocaleContext();

    let error = $state<AppError | undefined>(undefined);
    const throwIfUnlinkError = () => {
        if (error) {
            throw error;
        }
    };

    const resetError = async () => {
        error = undefined;
        await identities.refresh();
    };

    const unlinkIdentity = async (provider: string, providerUserId: string) => {
        await unlinkIdentityCommand({ provider, providerUserId }).updates(identities);
    };
</script>

<Card width="md" title={locale.t('account.identitiesTitle')}>
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
                            await resetError();
                            reset();
                        }}
                    >
                        {locale.t('common.retry')}
                    </Button>
                {/snippet}
            </ErrorCard>
        {/snippet}

        {throwIfUnlinkError()}
        <Stack>
            {#each await identities as identity (identity.provider + identity.providerUserId)}
                <LinkedIdentityItem
                    {identity}
                    disabled={identities.loading}
                    unlink={unlinkIdentity}
                    onerror={(err) => {
                        error = err;
                    }}
                />
            {/each}
            <AddLinkButton
                disabled={identities.loading}
                onerror={(err) => {
                    error = err;
                }}
            />
        </Stack>
    </svelte:boundary>
</Card>
