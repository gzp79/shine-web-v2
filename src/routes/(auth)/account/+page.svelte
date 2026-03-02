<script lang="ts">
    import ActiveSessionCard from '@lib/account/ActiveSessionCard.svelte';
    import ActiveTokenCard from '@lib/account/ActiveTokenCard.svelte';
    import LinkedIdentityCard from '@lib/account/LinkedIdentityCard.svelte';
    import UserInfoCard from '@lib/account/UserInfoCard.svelte';
    import {
        queryActiveSessions,
        queryActiveTokens,
        queryLinkedIdentities,
        revokeToken
    } from '@lib/account/auth.remote';
    import { getLocaleContext } from '@lib/i18n';
    import StackLayout from '@lib/ui/app/StackLayout.svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import { async } from '@lib/utils';

    const locale = getLocaleContext();
    const linkedIdentities = queryLinkedIdentities();
    const activeSessions = queryActiveSessions();
    const activeTokens = queryActiveTokens();

    const handleRevokeToken = async (tokenHash: string) => {
        await revokeToken(tokenHash);
    };
</script>

<StackLayout>
    <Typography variant="h1">{locale.t('account.account')}</Typography>

    <UserInfoCard />
    <LinkedIdentityCard
        identities={linkedIdentities}
        unlink={async () => {
            await linkedIdentities.refresh();
            await async.delay(2000);
        }}
    />
    <ActiveSessionCard sessions={activeSessions} />
    <ActiveTokenCard tokens={activeTokens} revoke={handleRevokeToken} />
</StackLayout>
