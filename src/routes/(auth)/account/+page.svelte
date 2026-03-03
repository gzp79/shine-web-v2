<script lang="ts">
    import ActiveSessionCard from '@lib/account/ActiveSessionCard.svelte';
    import ActiveTokenCard from '@lib/account/ActiveTokenCard.svelte';
    import LinkedIdentityCard from '@lib/account/LinkedIdentityCard.svelte';
    import UserInfoCard from '@lib/account/UserInfoCard.svelte';
    import { getLocaleContext } from '@lib/i18n';
    import StackLayout from '@lib/ui/app/StackLayout.svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';

    const locale = getLocaleContext();
</script>

<StackLayout>
    <Typography variant="h1">{locale.t('account.account')}</Typography>

    <UserInfoCard />
    <LinkedIdentityCard />
    <ActiveSessionCard />
    <ActiveTokenCard />
</StackLayout>
