<script module lang="ts">
    import { getLocaleContext } from '@lib/i18n';
    import { logAPI } from '@lib/loggers';
    import PropertyList from '@lib/ui/atoms/data/PropertyList.svelte';
    import brands, { type BrandGlyph } from '@lib/ui/atoms/glyphs/brands/all';
    import Card from '@lib/ui/atoms/layouts/Card.svelte';
    import ConfirmationButton from '@lib/ui/components/buttons/ConfirmationButton.svelte';
    import { type AppError, createAppError } from '@lib/utils';
    import type { LinkedIdentity } from './auth.remote';

    export type LinkedIdentityItemProps = {
        identity: LinkedIdentity;
        disabled?: boolean;
        unlink: (provider: string, providerUserId: string) => Promise<void>;
        onerror?: (error: AppError) => void;
    };
</script>

<script lang="ts">
    const { identity, disabled = false, unlink, onerror }: LinkedIdentityItemProps = $props();

    const locale = getLocaleContext();

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
    {#snippet icon({ class: cls })}
        {@const ProviderImage = providerImage}
        <ProviderImage class={cls} />
    {/snippet}

    <PropertyList
        size="xs"
        items={[
            {
                key: locale.t('account.provider'),
                value: identity.provider
            },
            {
                key: locale.t('account.providerUserId'),
                value: identity.providerUserId,
                valueClass: 'break-all'
            },
            identity.name
                ? {
                      key: locale.t('account.userName'),
                      value: identity.name
                  }
                : null,
            identity.email
                ? {
                      key: locale.t('account.email'),
                      value: identity.email,
                      valueClass: 'break-all'
                  }
                : null,
            {
                key: locale.t('account.linkDate'),
                value: locale.t('common.dateTime', { date: identity.linkedAt })
            }
        ]}
    />

    {#snippet actions()}
        <ConfirmationButton
            disabled={dirty || disabled}
            color="danger"
            confirmation={{
                title: locale.t('account.unlinkConfirmationTitle'),
                question: locale.t('account.unlinkConfirmationQuestion'),
                confirm: locale.t('account.unlinkConfirmationConfirmText'),
                cancel: locale.t('account.unlinkConfirmationCancelText')
            }}
            onConfirm={handleUnlink}
        >
            {locale.t('account.unlink')}
        </ConfirmationButton>
    {/snippet}
</Card>
