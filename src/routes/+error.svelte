<script lang="ts">
    import { resolve } from '$app/paths';
    import { page } from '$app/state';
    import { getLocaleContext } from '@lib/i18n';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import ErrorCard from '@lib/ui/components/cards/ErrorCard.svelte';

    const locale = getLocaleContext();

    // Rendered when a route's `load` fails — including `/error`'s own, which would otherwise leave
    // nothing to show. Deliberately depends on no load data beyond the root layout (already
    // resolved by the time this renders), so a failed data fetch cannot take this fallback down too.
    const error = $derived(page.error?.appError ?? page.error?.message ?? locale.t('errors.internalError'));
</script>

<CenteredLayout>
    <ErrorCard {error}>
        {#snippet actions()}
            <Button onclick={() => location.reload()}>{locale.t('common.refresh')}</Button>
            <Button color="primary" href={resolve('/')}>{locale.t('common.back')}</Button>
        {/snippet}
    </ErrorCard>
</CenteredLayout>
