<script lang="ts">
    import LinkedIdentityCard from '@lib/account/LinkedIdentityCard.svelte';
    import UserInfoCard from '@lib/account/UserInfoCard.svelte';
    import { queryLinkedIdentities } from '@lib/account/account.remote';
    import { getCurrentUserStore } from '@lib/account/currentUser.svelte';
    import { t } from '@lib/i18n/i18n.svelte';
    import MessageContent from '@lib/ui/app/MessageContent.svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';

    let currentUser = getCurrentUserStore();
    let linkedIdentities = queryLinkedIdentities();
</script>

<MessageContent>
    <Stack spacing={4}>
        <Typography variant="h1">{$t('account.account')}</Typography>

        <UserInfoCard userInfo={currentUser} />
        <LinkedIdentityCard identities={linkedIdentities} />
    </Stack>
</MessageContent>
