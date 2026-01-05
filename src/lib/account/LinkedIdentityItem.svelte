<script module lang="ts">
    import { t } from '@lib/i18n/i18n.svelte';
    import { logAPI } from '@lib/loggers';
    import PropertyList from '@lib/ui/atoms/data/PropertyList.svelte';
    import brands, { type BrandGlyph } from '@lib/ui/atoms/glyphs/brands/all';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Card from '@lib/ui/atoms/layouts/Card.svelte';
    import { type AppError, createAppError } from '@lib/utils';
    import type { LinkedIdentity } from './account.remote';

    export type LinkedIdentityItemProps = {
        identity: LinkedIdentity;
        disabled?: boolean;
        unlink: (provider: string, providerUserId: string) => Promise<void>;
        onerror?: (error: AppError) => void;
    };
</script>

<script lang="ts">
    const { identity, disabled = false, unlink, onerror }: LinkedIdentityItemProps = $props();

    let dirty = $state(false);
    const providerImage = $derived(brands[identity.provider as BrandGlyph] ?? null);

    const handleUnlink = async () => {
        dirty = true;
        try {
            await unlink(identity.provider, identity.providerUserId);
        } catch (e) {
            let error = createAppError(e);
            logAPI.error('Failed to unlink identity', error);
            onerror?.(error);
        } finally {
            dirty = false;
        }
    };
</script>

<Card width="full">
    {#snippet icon()}
        {@const ProviderImage = providerImage}
        <ProviderImage size="full" />
    {/snippet}

    <PropertyList
        size="xs"
        items={[
            {
                key: $t('account.provider'),
                value: identity.provider
            },
            {
                key: $t('account.providerUserId'),
                value: identity.providerUserId,
                valueClass: 'break-all'
            },
            identity.name
                ? {
                      key: $t('account.userName'),
                      value: identity.name
                  }
                : null,
            identity.email
                ? {
                      key: $t('account.email'),
                      value: identity.email,
                      valueClass: 'break-all'
                  }
                : null,
            {
                key: $t('account.linkDate'),
                value: $t(
                    'common.dateTime',
                    { value: identity.linkedAt },
                    { date: { dateStyle: 'long', timeStyle: 'medium' } }
                )
            }
        ]}
    />

    {#snippet actions()}
        <Button disabled={dirty || disabled} color="danger" onclick={handleUnlink}>
            {$t('account.unlink')}
        </Button>
    {/snippet}
</Card>
