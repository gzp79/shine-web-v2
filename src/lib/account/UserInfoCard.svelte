<script module lang="ts">
    import { logoutAllUrl, logoutUrl } from '@lib/account/account';
    import { t } from '@lib/i18n/i18n.svelte';
    import PropertyList from '@lib/ui/atoms/data/PropertyList.svelte';
    import { Alert } from '@lib/ui/atoms/data/alert';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Card from '@lib/ui/atoms/layouts/Card.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import ComboButton from '@lib/ui/components/buttons/ComboButton.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';
    import LoadingCard from '@lib/ui/components/cards/LoadingCard.svelte';
    import { type QueryLike, createAppError } from '@lib/utils';
    import type { AuthenticatedCurrentUser, CurrentUser } from './currentUser.svelte';

    export type UserInfoCardProps = {
        userInfo: QueryLike<CurrentUser>;
    };
</script>

<script lang="ts">
    let { userInfo }: UserInfoCardProps = $props();

    let hasError = $state(false);
    let hasUserInfo = $derived(!!userInfo?.current);

    const refreshUserInfo = async () => {
        await userInfo.refresh();
    };
</script>

{#snippet emailItem()}
    {@const user = (await userInfo) as AuthenticatedCurrentUser}
    {user.email}
    {user.isEmailVerified}
{/snippet}

{#snippet actions()}
    <ComboButton
        disabled={!hasUserInfo}
        options={[
            { caption: $t('account.logout'), href: logoutUrl },
            { caption: $t('account.logoutAll'), href: logoutAllUrl }
        ]}
    />
{/snippet}

<Card width="md" title={$t('account.userInfo.title')} actions={hasError ? undefined : actions}>
    <svelte:boundary onerror={() => (hasError = true)}>
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
                            hasError = false;
                            reset();
                        }}
                    >
                        {$t('common.retry')}
                    </Button>
                {/snippet}
            </ErrorCard>
        {/snippet}

        {@const user = await userInfo}
        {#if user.authenticated}
            <Stack class="items-center justify-center">
                {#if !user.isLinked}
                    <Alert variant="warning" title={$t('account.linkWarning')} />
                {/if}

                <PropertyList
                    size="xs"
                    wide
                    items={[
                        { key: $t('account.userName'), value: user.name, valueClass: 'break-all' },
                        { key: $t('account.userId'), value: user.id, valueClass: 'break-all' },
                        { key: $t('account.email'), value: emailItem },
                        // { key: $t('account.role'), value: user.roles.join(', ') },
                        {
                            key: $t('account.registrationDate'),
                            // value: $t('common.dateTime ', { value: user.createdAt }, { date: { dateStyle: 'long' } })
                            value: user.createdAt.toString()
                        }
                    ]}
                />
            </Stack>
        {/if}
    </svelte:boundary>
</Card>
