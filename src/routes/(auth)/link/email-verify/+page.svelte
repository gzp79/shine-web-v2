<script lang="ts">
    import { page } from '$app/state';
    import { completeEmailOperation } from '@lib/account/auth.remote';
    import { getAuthenticatedUserContext } from '@lib/account/authContext.svelte';
    import { getLocaleContext } from '@lib/i18n';
    import { logUser } from '@lib/loggers';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';
    import LoadingCard from '@lib/ui/components/cards/LoadingCard.svelte';

    const locale = getLocaleContext();
    const auth = getAuthenticatedUserContext();

    const token = page.url.searchParams.get('token');
    const task = token ? completeEmailOperation(token) : Promise.reject(new Error('Missing verification token'));

    /// Nothing invalidates the cached current user, so without this `/account` would keep showing
    /// the pre-change email. Not awaited: the operation already succeeded, so a failed refresh must
    /// not turn the success page into an error.
    task.then(
        () =>
            auth
                .refresh()
                .catch((err) => logUser.warn('Refreshing the current user after an email operation failed', err)),
        () => undefined // the operation's own failure is already rendered by `{#await task}` below
    );
</script>

<CenteredLayout>
    {#await task}
        <LoadingCard />
    {:then _}
        <Typography variant="h1" class="text-center">{locale.t('account.emailOperationSuccess')}</Typography>
        <Button href="/account">{locale.t('common.ok')}</Button>
    {:catch error}
        <ErrorCard {error}>
            {#snippet actions()}
                <Button href="/">{locale.t('common.ok')}</Button>
            {/snippet}
        </ErrorCard>
    {/await}
</CenteredLayout>
