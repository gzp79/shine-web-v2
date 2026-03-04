<script module lang="ts">
    import type { AppError } from '@lib/utils';

    export type AddLinkButtonProps = {
        disabled?: boolean;
        onerror?: (error: AppError) => void;
    };
</script>

<script lang="ts">
    import { getLocaleContext } from '@lib/i18n';
    import brands from '@lib/ui/atoms/glyphs/brands/all';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';
    import Dialog from '@lib/ui/atoms/layouts/Dialog.svelte';
    import { createAppError, pascalCase } from '@lib/utils';
    import { queryExternalLoginProviders } from './auth.remote';

    let { disabled = false, onerror }: AddLinkButtonProps = $props();

    const locale = getLocaleContext();
    const providersQuery = queryExternalLoginProviders();

    let isDialogOpen = $state(false);
    let isSubmitting = $state(false);
</script>

<Button size="sm" {disabled} onclick={() => (isDialogOpen = true)}>
    {locale.t('account.linkProvider')}
</Button>

<Dialog bind:open={isDialogOpen} width="sm" title={locale.t('account.linkProviderTitle')}>
    <Box scrollShadow containerClass="w-full" contentClass="flex flex-col gap-2">
        {#await providersQuery}
            <p>{locale.t('common.loading')}</p>
        {:then providers}
            {#each providers as provider (provider)}
                <form
                    method="GET"
                    action="/api/auth/{provider}/link"
                    data-sveltekit-reload
                    onsubmit={() => (isSubmitting = true)}
                >
                    <input type="hidden" name="redirectUrl" value="/account" />
                    <Button wide color="primary" type="submit" disabled={isSubmitting || disabled}>
                        {@const ProviderIcon = brands[provider]}
                        {#if ProviderIcon}
                            <ProviderIcon size="sm" />
                        {/if}
                        {pascalCase(provider)}
                    </Button>
                </form>
            {/each}
        {:catch error}
            {onerror?.(createAppError(error))}
        {/await}
    </Box>
</Dialog>
