<script module lang="ts">
    import { t } from '@lib/i18n/i18n.svelte';
    import { formatLocation } from '@lib/i18n/utils';
    import { logAPI } from '@lib/loggers';
    import PropertyList from '@lib/ui/atoms/data/PropertyList.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Card from '@lib/ui/atoms/layouts/Card.svelte';
    import { type AppError, createAppError } from '@lib/utils';
    import type { ActiveToken } from './account.remote';

    export type ActiveTokenItemProps = {
        token: ActiveToken;
        disabled?: boolean;
        revoke: (tokenHash: string) => Promise<void>;
        onerror?: (error: AppError) => void;
    };
</script>

<script lang="ts">
    let { token, revoke, disabled = false, onerror }: ActiveTokenItemProps = $props();

    let dirty = $state(false);
    const location = $derived(formatLocation(token));

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
                key: $t('account.tokenHash'),
                value: token.tokenHash,
                valueClass: 'break-all'
            },
            {
                key: $t('account.tokenKind'),
                value: token.kind
            },
            {
                key: $t('account.activeStatus'),
                value: token.isExpired ? $t('account.expired') : $t('account.active'),
                valueClass: token.isExpired ? 'bg-warning text-on-warning px-1 inline-block' : ''
            },
            {
                key: $t('account.creationDate'),
                value: $t(
                    'common.dateTime',
                    { value: token.createdAt },
                    { date: { dateStyle: 'long', timeStyle: 'medium' } }
                )
            },
            {
                key: $t('account.expirationDate'),
                value: $t(
                    'common.dateTime',
                    { value: token.expireAt },
                    { date: { dateStyle: 'long', timeStyle: 'medium' } }
                )
            },
            {
                key: $t('account.location'),
                value: location
            }
        ]}
    />

    {#snippet actions()}
        <Button disabled={dirty || disabled} color="danger" onclick={handleRevoke}>
            {$t('account.revoke')}
        </Button>
    {/snippet}
</Card>
