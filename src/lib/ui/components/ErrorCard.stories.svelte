<script module lang="ts">
    import { lorem } from '@sb/lorem';
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect } from 'storybook/test';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import { widthList } from '@lib/ui/atoms/layouts';
    import ErrorCard from '@lib/ui/components/ErrorCard.svelte';
    import type { AppError } from '@lib/utils';

    const { Story } = defineMeta({
        component: ErrorCard,
        title: 'Components/Status/Error',
        args: {},
        argTypes: {
            width: {
                control: { type: 'select' },
                options: ['default', ...widthList],
                mapping: {
                    default: undefined
                }
            }
        },
        play: async ({ canvasElement }) => {
            expect(canvasElement).toBeDefined();
        }
    });

    const createError = (kind: 'fetch' | 'other' | 'retryLimit', message: string, details?: unknown): AppError => {
        return {
            type: 'app-error',
            kind,
            message,
            details
        } as AppError;
    };
</script>

<Story name="Default" args={{ error: createError('other', 'Some test error') }} />

<Story
    name="ErrorWithAllFeatures"
    args={{
        error: createError('retryLimit', 'Maximum retry attempts exceeded.', {
            retryCount: 3,
            lastError: 'Connection timeout',
            lorem: lorem
        })
    }}
>
    {#snippet template(args)}
        <ErrorCard {...args}>
            <Typography variant="footnote">
                If this problem persists, please contact our support team at support@example.com or call 1-800-SUPPORT.
            </Typography>
            {#snippet actions()}
                <Button color="secondary">Retry</Button>
                <Button color="primary">Cancel</Button>
            {/snippet}
        </ErrorCard>
    {/snippet}
</Story>
