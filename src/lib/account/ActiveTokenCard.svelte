<script module lang="ts">
    import { getLocaleContext } from '@lib/i18n';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Card from '@lib/ui/atoms/layouts/Card.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';
    import LoadingCard from '@lib/ui/components/cards/LoadingCard.svelte';
    import { type AppError, createAppError } from '@lib/utils';
    import ActiveTokenItem from './ActiveTokenItem.svelte';
    import { queryActiveTokens, revokeToken as revokeTokenCommand } from './auth.remote';
</script>

<script lang="ts">
    const tokens = queryActiveTokens();
    const locale = getLocaleContext();

    let error = $state<AppError | undefined>(undefined);
    // TODO: workaround for https://github.com/sveltejs/kit/issues/14536
    let isRevoking = $state(false);

    const throwIfError = () => {
        if (error) {
            throw error;
        }
    };

    const resetError = async () => {
        error = undefined;
        isRevoking = false;
        await tokens.refresh();
    };

    const revokeToken = async (tokenHash: string) => {
        isRevoking = true;
        try {
            await revokeTokenCommand(tokenHash).updates(tokens);
        } finally {
            isRevoking = false;
        }
    };
</script>

<Card width="md" title={locale.t('account.activeTokensTitle')}>
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

        {throwIfError()}
        <Stack>
            {#each await tokens as token (token.tokenHash)}
                <ActiveTokenItem
                    {token}
                    disabled={tokens.loading || isRevoking}
                    revoke={revokeToken}
                    onerror={(err) => {
                        error = err;
                    }}
                />
            {/each}
        </Stack>
    </svelte:boundary>
</Card>
