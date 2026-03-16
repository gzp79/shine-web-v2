<script lang="ts">
    import { getLocaleContext } from '@lib/i18n';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Warning from '@lib/ui/atoms/icons/common/Warning.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';

    const locale = getLocaleContext();
</script>

<CenteredLayout>
    <Box width="fit" padding={4}>
        <Stack direction="column" spacing={4} alignment="center">
            <Warning class="w-16 h-16 text-on-danger" />
            <Typography variant="h2">{locale.t('accountDeleted.title')}</Typography>
            <Typography variant="text" class="text-center">
                {locale.t('accountDeleted.message')}
            </Typography>
            <Button href="/login">
                {locale.t('accountDeleted.linkText')}
            </Button>
        </Stack>
    </Box>
</CenteredLayout>
