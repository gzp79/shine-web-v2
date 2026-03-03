<script module lang="ts">
    import { getLocaleContext } from '@lib/i18n';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Card from '@lib/ui/atoms/layouts/Card.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';
    import LoadingCard from '@lib/ui/components/cards/LoadingCard.svelte';
    import { createAppError } from '@lib/utils';
    import ActiveSessionItem from './ActiveSessionItem.svelte';
    import { queryActiveSessions } from './auth.remote';
</script>

<script lang="ts">
    const sessions = queryActiveSessions();
    const locale = getLocaleContext();

    const refreshSessions = async () => {
        await sessions.refresh();
    };
</script>

<Card width="md" title={locale.t('account.activeSessionsTitle')}>
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
                            await refreshSessions();
                            reset();
                        }}
                    >
                        {locale.t('common.retry')}
                    </Button>
                {/snippet}
            </ErrorCard>
        {/snippet}

        <Stack>
            {#each await sessions as session (session.tokenHash)}
                <ActiveSessionItem {session} />
            {/each}
        </Stack>
    </svelte:boundary>
</Card>
