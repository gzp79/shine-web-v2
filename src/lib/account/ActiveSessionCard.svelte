<script module lang="ts">
    import { t } from '@lib/i18n/i18n.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Card from '@lib/ui/atoms/layouts/Card.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import ErrorCard from '@lib/ui/components/ErrorCard.svelte';
    import LoadingCard from '@lib/ui/components/LoadingCard.svelte';
    import { type QueryLike, createAppError } from '@lib/utils';
    import ActiveSessionItem from './ActiveSessionItem.svelte';
    import type { ActiveSession } from './account.remote';

    export type ActiveSessionCardProps = {
        sessions: QueryLike<ActiveSession[]>;
    };
</script>

<script lang="ts">
    let { sessions }: ActiveSessionCardProps = $props();

    const refreshSessions = async () => {
        await sessions.refresh();
    };
</script>

<Card shadow width="lg">
    {#snippet title()}
        {$t('account.activeSessions.title')}
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
                            await refreshSessions();
                            reset();
                        }}
                    >
                        {$t('common.retry')}
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
