<script module lang="ts">
    import { t } from '@lib/i18n/i18n.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Card from '@lib/ui/atoms/layouts/Card.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import ErrorCard from '@lib/ui/components/ErrorCard.svelte';
    import LoadingCard from '@lib/ui/components/LoadingCard.svelte';
    import { type AppError, type QueryLike, createAppError } from '@lib/utils';
    import ActiveTokenItem from './ActiveTokenItem.svelte';
    import type { ActiveToken } from './account.remote';

    export type ActiveTokenCardProps = {
        tokens: QueryLike<ActiveToken[]>;
        revoke: (tokenHash: string) => Promise<void>;
    };
</script>

<script lang="ts">
    let { tokens, revoke }: ActiveTokenCardProps = $props();

    let revokeError = $state<AppError | undefined>(undefined);

    const throwIfRevokeError = () => {
        if (revokeError) {
            throw revokeError;
        }
    };

    const refreshTokens = async () => {
        revokeError = undefined;
        await tokens.refresh();
    };

    const revokeToken = async (tokenHash: string) => {
        await revoke(tokenHash);
        await tokens.refresh();
    };
</script>

<Card width="lg">
    {#snippet title()}
        {$t('account.activeTokens.title')}
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
                            await refreshTokens();
                            reset();
                        }}
                    >
                        {$t('common.retry')}
                    </Button>
                {/snippet}
            </ErrorCard>
        {/snippet}

        {throwIfRevokeError()}
        <Stack>
            {#each await tokens as token (token.tokenHash)}
                <ActiveTokenItem
                    {token}
                    disabled={tokens.loading}
                    revoke={revokeToken}
                    onerror={(err) => {
                        revokeError = err;
                    }}
                />
            {/each}
        </Stack>
    </svelte:boundary>
</Card>
