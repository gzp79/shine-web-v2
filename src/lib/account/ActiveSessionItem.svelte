<script module lang="ts">
    import { UAParser } from 'ua-parser-js';
    import { getLocaleContext } from '@lib/i18n';
    import PropertyList from '@lib/ui/atoms/data/PropertyList.svelte';
    import brands from '@lib/ui/atoms/glyphs/brands/all';
    import Card from '@lib/ui/atoms/layouts/Card.svelte';
    import type { ActiveSession } from './auth.remote';

    export type ActiveSessionItemProps = {
        session: ActiveSession;
    };
</script>

<script lang="ts">
    const { session }: ActiveSessionItemProps = $props();

    const locale = getLocaleContext();

    const agent = $derived.by(() => new UAParser(session.agent).getResult());
    const agentImage = $derived.by(() => {
        const browser = agent.browser.name?.toLowerCase();
        const os = agent.os.name?.toLowerCase();
        const device = agent.device.type?.toLowerCase();

        if (device === 'mobile') {
            if (os === 'android') {
                return brands.android;
            }
            if (os === 'ios') {
                return brands.iphone;
            }
            return brands.mobile;
        }

        if (os === 'mac os') {
            return brands.mac;
        }

        if (browser?.includes('edge')) {
            return brands.edge;
        } else if (browser?.includes('safari')) {
            return brands.safari;
        } else if (browser?.includes('firefox')) {
            return brands.firefox;
        } else if (browser?.includes('opera')) {
            return brands.opera;
        } else if (browser?.includes('chrome')) {
            return brands.chrome;
        }

        return null;
    });

    const location = 'FIXME'; //$derived(formatLocation(session));
</script>

<Card width="full">
    {#snippet icon({ class: cls })}
        {@const AgentImage = agentImage}
        <AgentImage class={cls} />
    {/snippet}

    <PropertyList
        size="xs"
        items={[
            {
                key: locale.t('account.sessionFingerprint'),
                value: session.fingerprint,
                valueClass: 'break-all'
            },
            {
                key: locale.t('account.userAgent'),
                value: session.agent
            },
            {
                key: locale.t('account.loginDate'),
                value: locale.t('common.dateTime', { date: session.createdAt })
            },
            {
                key: locale.t('account.location'),
                value: location
            }
        ]}
    />
</Card>
