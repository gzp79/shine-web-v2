<script lang="ts">
    import { page } from '$app/state';
    import { completeEmailOperation } from '@lib/account/auth.remote';
    import { getLocaleContext } from '@lib/i18n';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';
    import LoadingCard from '@lib/ui/components/cards/LoadingCard.svelte';

    const locale = getLocaleContext();

    const token = $derived(page.url.searchParams.get('token'));
    const task = $derived(
        token ? completeEmailOperation(token) : Promise.reject(new Error('Missing verification token'))
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
