<script module lang="ts">
    import type { Snippet } from 'svelte';
    import { getLocaleContext } from '@lib/i18n';
    import Dropdown from '@lib/ui//atoms/icons/common/Dropdown.svelte';
    import Fatal from '@lib/ui//atoms/icons/common/Fatal.svelte';
    import Card from '@lib/ui//atoms/layouts/Card.svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import { type LayoutWidth } from '@lib/ui/atoms/layouts';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import { type AppErrorKind, createAppError } from '@lib/utils';

    export type ErrorCardProps = {
        /** Custom caption/title for the error (defaults to localized "Something went wrong") */
        caption?: string;
        /** Anything thrown or caught — normalized to an `AppError` here, so call sites need not. */
        error: unknown;
        /** Width of the error card */
        width?: LayoutWidth;
        /** Optional content to render below the error details */
        children?: Snippet;
        /** Optional action buttons (e.g., retry, dismiss) */
        actions?: Snippet;
    };
</script>

<script lang="ts">
    let { caption, error, width = 'fit', children, actions }: ErrorCardProps = $props();

    const locale = getLocaleContext();

    const errorKindLabels: Record<AppErrorKind, string> = {
        fetch: locale.t('errors.networkError'),
        retryLimit: locale.t('errors.retryLimitError'),
        other: locale.t('errors.error')
    };

    const appError = $derived(createAppError(error));
    const errorLabel = $derived(errorKindLabels[appError.kind]);
</script>

<Card
    {width}
    color="danger"
    title={caption ?? locale.t('common.somethingWentWrong')}
    {actions}
    role="alert"
    aria-live="assertive"
>
    {#snippet icon({ class: cls })}
        <Fatal class={cls} />
    {/snippet}

    <Stack>
        <Typography variant="text" class="whitespace-pre-line text-text-primary">
            {appError.message || errorLabel}
        </Typography>
        {#if appError.details}
            <details class="group cursor-pointer">
                <summary class="list-none select-none text-sm font-medium text-text-secondary hover:text-text-primary">
                    <span class="inline-flex items-center gap-1">
                        <Dropdown class="-rotate-90 group-open:rotate-0 transition-transform duration-300" />
                        {locale.t('common.details')}
                    </span>
                </summary>

                <Box border>
                    <Typography variant="code">
                        <pre class="max-h-64 whitespace-pre-wrap wrap-break-word text-xs">{JSON.stringify(
                                appError.details,
                                null,
                                2
                            )}</pre>
                    </Typography>
                </Box>
            </details>
        {/if}

        {#if children}
            {@render children()}
        {/if}
    </Stack>
</Card>

<style>
    details {
        &::details-content {
            max-height: 0;
            transition:
                content-visibility 300ms allow-discrete,
                max-height 300ms;
        }

        &[open]::details-content {
            max-height: 100vh;
        }
    }
</style>
