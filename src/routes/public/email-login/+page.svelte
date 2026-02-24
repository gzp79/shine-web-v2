<script lang="ts">
    import { getLocaleContext } from '@lib/i18n';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Email from '@lib/ui/atoms/glyphs/brands/Email.svelte';
    import Card from '@lib/ui/atoms/layouts/Card.svelte';

    const locale = getLocaleContext();
</script>

<CenteredLayout>
    <Card width="fit" title={locale.t('login.emailModalTitle')}>
        {#snippet icon({ class: cls })}
            <Email class={cls} />
        {/snippet}
        <Typography variant="text" class="text-justify max-w-md">{locale.t('login.emailWaitUser')}</Typography>
    </Card>
</CenteredLayout>
