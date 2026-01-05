<script module lang="ts">
    import { t } from '@lib/i18n/i18n.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Card from '@lib/ui/atoms/layouts/Card.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import ErrorCard from '@lib/ui/components/ErrorCard.svelte';
    import LoadingCard from '@lib/ui/components/LoadingCard.svelte';
    import { type AppError, type QueryLike, createAppError } from '@lib/utils';
    import LinkedIdentityItem from './LinkedIdentityItem.svelte';
    import type { LinkedIdentity } from './account.remote';

    export type LinkedIdentityCardProps = {
        identities: QueryLike<LinkedIdentity[]>;
        unlink: (provider: string, providerUserId: string) => Promise<void>;
    };
</script>

<script lang="ts">
    let { identities, unlink }: LinkedIdentityCardProps = $props();

    let unlinkError = $state<AppError | undefined>(undefined);
    const throwIfUnlinkError = () => {
        if (unlinkError) {
            throw unlinkError;
        }
    };

    const refreshIdentities = async () => {
        unlinkError = undefined;
        await identities.refresh();
    };

    const unlinkIdentity = async (provider: string, providerUserId: string) => {
        await unlink(provider, providerUserId);
        await identities.refresh();
    };
</script>

<Card width="lg">
    {#snippet title()}
        {$t('account.identities.title')}
    {/snippet}

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
                            await refreshIdentities();
                            reset();
                        }}
                    >
                        {$t('common.retry')}
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
                        unlinkError = err;
                    }}
                />
            {/each}
        </Stack>
    </svelte:boundary>
</Card>
