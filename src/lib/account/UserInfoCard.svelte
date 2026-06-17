<script module lang="ts">
    import { getLogoutContext } from '@lib/account/LogoutGuard.svelte';
    import { getLocaleContext } from '@lib/i18n';
    import PropertyList from '@lib/ui/atoms/data/PropertyList.svelte';
    import { Alert } from '@lib/ui/atoms/data/alert';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Card from '@lib/ui/atoms/layouts/Card.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import ComboButton from '@lib/ui/components/buttons/ComboButton.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';
    import LoadingCard from '@lib/ui/components/cards/LoadingCard.svelte';
    import { type AppError, createAppError } from '@lib/utils';
    import EmailConfirmButton from './EmailConfirmButton.svelte';
    import { queryCurrentUserInfo } from './auth.remote';
    import type { AuthenticatedCurrentUser } from './currentUserStore.svelte';
</script>

<script lang="ts">
    const userInfo = queryCurrentUserInfo();
    const locale = getLocaleContext();
    const { requestLogout } = getLogoutContext();

    const logoutOptions = $derived([
        { caption: locale.t('account.logout'), onclick: () => requestLogout({ terminateAll: false }) },
        { caption: locale.t('account.logoutAll'), onclick: () => requestLogout({ terminateAll: true }) }
    ]);

    let error = $state<AppError | undefined>(undefined);
    let hasError = $derived(error !== undefined);
    let hasUserInfo = $derived(!!userInfo?.current);
    let isLinked = $derived(userInfo.current?.authenticated ? userInfo.current.isLinked : false);

    const throwIfError = () => {
        if (error) {
            throw error;
        }
    };

    const resetError = async () => {
        await userInfo.refresh();
        error = undefined;
    };
</script>

{#snippet emailItem()}
    {@const user = (await userInfo) as AuthenticatedCurrentUser}
    <Stack direction="row" spacing={2} alignment="center">
        <span>{user.email || locale.t('account.noEmail')}</span>
        <EmailConfirmButton
            variant={user.isEmailVerified || !user.email ? 'change' : 'confirmOrChange'}
            onerror={(err) => {
                error = err;
            }}
        />
    </Stack>
{/snippet}

{#snippet actions()}
    <ComboButton disabled={!hasUserInfo} options={logoutOptions} />
{/snippet}

<Card width="md" title={locale.t('account.userInfoTitle')} actions={hasError ? undefined : actions}>
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

        {@const user = await userInfo}
        {throwIfError()}
        {#if user.authenticated}
            <Stack class="items-center justify-center">
                {#if !isLinked}
                    <Alert variant="warning" title={locale.t('account.linkWarning')} />
                {/if}

                <PropertyList
                    size="xs"
                    wide
                    items={[
                        { key: locale.t('account.userName'), value: user.name, valueClass: 'break-all' },
                        { key: locale.t('account.userId'), value: user.id, valueClass: 'break-all' },
                        { key: locale.t('account.email'), value: emailItem },
                        // { key: locale.t('account.role'), value: user.roles.join(', ') },
                        {
                            key: locale.t('account.registrationDate'),
                            // value: locale.t('common.dateTime ', { value: user.createdAt }, { date: { dateStyle: 'long' } })
                            value: user.createdAt.toString()
                        }
                    ]}
                />
            </Stack>
        {/if}
    </svelte:boundary>
</Card>
