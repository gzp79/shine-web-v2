<script lang="ts">
    import { t } from '@lib/i18n/i18n.svelte';
    import CenteredLayout from '@lib/ui/app/CenteredLayout.svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Email from '@lib/ui/atoms/glyphs/brands/Email.svelte';
    import Card from '@lib/ui/atoms/layouts/Card.svelte';
</script>

<CenteredLayout>
    <Card width="fit" title={$t('login.emailModalTitle')}>
        {#snippet icon({ class: cls })}
            <Email class={cls} />
        {/snippet}
        <Typography variant="text" class="text-justify max-w-md">{$t('login.emailWaitUser')}</Typography>
    </Card>
</CenteredLayout>
