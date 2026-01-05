<script module lang="ts">
    import { t } from '@lib/i18n/i18n.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Card from '@lib/ui/atoms/layouts/Card.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import ErrorCard from '@lib/ui/components/ErrorCard.svelte';
    import LoadingCard from '@lib/ui/components/LoadingCard.svelte';
    import { type QueryLike, createAppError } from '@lib/utils';
    import type { CurrentUser } from './currentUser.svelte';

    export type UserInfoCardProps = {
        userInfo: QueryLike<CurrentUser>;
    };
</script>

<script lang="ts">
    let { userInfo }: UserInfoCardProps = $props();

    const refreshUserInfo = async () => {
        await userInfo.refresh();
    };
</script>

<Card width="lg">
    {#snippet title()}
        {$t('account.userInfo.title')}
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
                            await refreshUserInfo();
                            reset();
                        }}
                    >
                        {$t('common.retry')}
                    </Button>
                {/snippet}
            </ErrorCard>
        {/snippet}

        {JSON.stringify(await userInfo)}
    </svelte:boundary>
</Card>
