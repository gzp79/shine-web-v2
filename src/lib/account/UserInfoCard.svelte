<script module lang="ts">
    import { t } from '@lib/i18n/i18n.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Card from '@lib/ui/atoms/layouts/Card.svelte';
    import type { IQuery } from '@lib/utils';
    import type { CurrentUser } from './currentUser.svelte';

    export type UserInfoCardProps = {
        userInfo: IQuery<CurrentUser>;
    };
</script>

<script lang="ts">
    let { userInfo }: UserInfoCardProps = $props();
</script>

<Card>
    {#snippet title()}
        {$t('account.userInfo.title')}
    {/snippet}

    <svelte:boundary>
        {#if userInfo.loading}
            Loading linked identities...
        {:else if userInfo.error}
            Error loading linked identities: {JSON.stringify(userInfo.error)}
            <Button onclick={() => userInfo.refresh()}>Retry</Button>
        {:else}
            {JSON.stringify(userInfo.current)}
        {/if}
    </svelte:boundary>
</Card>
