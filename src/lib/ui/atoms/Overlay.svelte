<script module lang="ts">
    export type OverlayProps = {
        opacity?: number;
        src: string | string[];
    };
</script>

<script lang="ts">
    import { cn } from '@lib/ui/utils';

    let { opacity = 0.5, src }: OverlayProps = $props();

    const cls = $derived(cn('absolute top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat pointer-events-none'));
    const style = $derived(
        [
            `background-image: ${(typeof src === 'string' ? [src] : src).map((url) => `url(${url})`).join(',')}`,
            opacity && `opacity: ${opacity}`
        ].join('; ')
    );
    $inspect('style', style);
</script>

<div class={cls} {style}></div>
