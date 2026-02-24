<script lang="ts">
    import { getLocaleContext } from '@lib/i18n';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Check from '@lib/ui/atoms/icons/common/Check.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';

    const locale = getLocaleContext();
</script>

<CenteredLayout>
    <Box width="fit" padding={4}>
        <Stack direction="column" spacing={4} alignment="center">
            <Check class="w-16 h-16 text-success" />
            <Typography variant="h2">{locale.t('account.byeTitle')}</Typography>
            <Typography variant="text" class="text-center">
                {locale.t('account.byeMessage')}
            </Typography>
            <Button href="/login">
                {locale.t('common.back')}
            </Button>
        </Stack>
    </Box>
</CenteredLayout>
