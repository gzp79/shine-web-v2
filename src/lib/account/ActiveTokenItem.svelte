<script module lang="ts">
    import { getLocaleContext } from '@lib/i18n';
    import { logAPI } from '@lib/loggers';
    import PropertyList from '@lib/ui/atoms/data/PropertyList.svelte';
    import Card from '@lib/ui/atoms/layouts/Card.svelte';
    import ConfirmationButton from '@lib/ui/components/buttons/ConfirmationButton.svelte';
    import { type AppError, createAppError } from '@lib/utils';
    import type { ActiveToken } from './auth.remote';

    export type ActiveTokenItemProps = {
        token: ActiveToken;
        disabled?: boolean;
        revoke: (tokenHash: string) => Promise<void>;
        onerror?: (error: AppError) => void;
    };
</script>

<script lang="ts">
    let { token, revoke, disabled = false, onerror }: ActiveTokenItemProps = $props();

    const locale = getLocaleContext();

    let dirty = $state(false);
    const location = 'FIXME'; // $derived(formatLocation(token));

    const handleRevoke = async () => {
        dirty = true;
        try {
            await revoke(token.tokenHash);
        } catch (e) {
            let error = createAppError(e);
            logAPI.error('Failed to revoke token', error);
            onerror?.(error);
        } finally {
            dirty = false;
        }
    };
</script>

<Card width="full">
    <PropertyList
        size="xs"
        items={[
            {
                key: locale.t('account.tokenHash'),
                value: token.tokenHash,
                valueClass: 'break-all'
            },
            {
                key: locale.t('account.tokenKind'),
                value: token.kind
            },
            {
                key: locale.t('account.activeStatus'),
                value: token.isExpired ? locale.t('account.expired') : locale.t('account.active'),
                valueClass: token.isExpired ? 'bg-warning text-on-warning px-1 inline-block' : ''
            },
            {
                key: locale.t('account.creationDate'),
                value: locale.t('common.dateTime', { date: token.createdAt })
            },
            {
                key: locale.t('account.expirationDate'),
                value: locale.t('common.dateTime', { date: token.expireAt })
            },
            {
                key: locale.t('account.location'),
                value: location
            }
        ]}
    />

    {#snippet actions()}
        <ConfirmationButton
            disabled={dirty || disabled}
            color="danger"
            confirmation={{
                title: locale.t('account.revokeTokenConfirmationTitle'),
                question: locale.t('account.revokeTokenConfirmationQuestion'),
                confirm: locale.t('account.revokeTokenConfirmationConfirmText'),
                cancel: locale.t('account.revokeTokenConfirmationCancelText')
            }}
            confirmAction={{ onclick: handleRevoke }}
        >
            {locale.t('account.revoke')}
        </ConfirmationButton>
    {/snippet}
</Card>
