<script module lang="ts">
    import { t } from '@lib/i18n/i18n.svelte';
    import type { Size } from '@lib/ui/atoms';
    import Typography, { type Variant } from '@lib/ui/atoms/Typography.svelte';
    import Dots from '@lib/ui/atoms/icons/animated/Dots.svelte';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';

    export type LoadingProps = {
        /** Loading message to display (defaults to localized "Loading") */
        label?: string;
        /** Size of the loading animation and text */
        size?: Size;
        /** Variant of the loading card */
        variant?: 'default' | 'ghost';
    };
</script>

<script lang="ts">
    const textVariant: Record<Size, Variant> = {
        xs: 'h6',
        sm: 'h5',
        md: 'h4',
        lg: 'h3'
    };

    let { size = 'md', label, variant = 'default' }: LoadingProps = $props();
</script>

<Box role="status" aria-live="polite" width="fit" border={variant !== 'ghost'} ghost={variant === 'ghost'}>
    <Typography variant={textVariant[size]} element="p">
        {label ?? $t('common.loading')}
        <Dots />
    </Typography>
</Box>
