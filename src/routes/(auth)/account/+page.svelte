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
    } from '@lib/account/account.remote';
    import { getCurrentUserStore } from '@lib/account/currentUser.svelte';
    import { t } from '@lib/i18n/i18n.svelte';
    import FlowContent from '@lib/ui/app/FlowContent.svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import { async } from '@lib/utils';

    let currentUser = getCurrentUserStore();
    let linkedIdentities = queryLinkedIdentities();
    let activeSessions = queryActiveSessions();
    let activeTokens = queryActiveTokens();

    const handleRevokeToken = async (tokenHash: string) => {
        await revokeToken(tokenHash);
    };
</script>

<FlowContent>
    <Typography variant="h1">{$t('account.account')}</Typography>

    <UserInfoCard userInfo={currentUser} />
    <LinkedIdentityCard
        identities={linkedIdentities}
        unlink={async () => {
            await linkedIdentities.refresh();
            await async.delay(2000);
        }}
    />
    <ActiveSessionCard sessions={activeSessions} />
    <ActiveTokenCard tokens={activeTokens} revoke={handleRevokeToken} />
</FlowContent>
