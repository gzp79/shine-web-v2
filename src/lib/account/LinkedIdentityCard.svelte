<script module lang="ts">
    import { t } from '@lib/i18n/i18n.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Card from '@lib/ui/atoms/layouts/Card.svelte';
    import type { IQuery } from '@lib/utils';
    import type { LinkedIdentity } from './account.remote';

    export type LinkedIdentityCardProps = {
        identities: IQuery<LinkedIdentity[]>;
    };
</script>

<script lang="ts">
    let { identities }: LinkedIdentityCardProps = $props();
</script>

<Card>
    {#snippet title()}
        {$t('account.identities.title')}
    {/snippet}

    <svelte:boundary>
        {#if identities.loading}
            Loading linked identities...
        {:else if identities.error}
            Error loading linked identities: {JSON.stringify(identities.error)}
            <Button onclick={() => identities.refresh()}>Retry</Button>
        {:else}
            <h2>Linked Identities</h2>

            {JSON.stringify(identities.current)}
        {/if}
    </svelte:boundary>
</Card>
