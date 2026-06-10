<script module lang="ts">
    export type OverlayProps = {
        opacity?: number;
        src: string | string[];
        class?: string;
        style?: string;
    };
</script>

<script lang="ts">
    import { cn } from '@lib/ui/utils';

    let { opacity, src, class: className, style }: OverlayProps = $props();

    const cls = $derived(
        cn(
            'absolute top-0 left-0 w-full h-full',
            'bg-cover bg-center bg-no-repeat bg-fixed',
            'pointer-events-none',
            className
        )
    );
    const stl = $derived(
        [
            `background-image: ${(typeof src === 'string' ? [src] : src).map((url) => `url("${url.replace(/"/g, '%22')}")`).join(',')}`,
            opacity ? `opacity: ${opacity}` : '',
            style ?? ''
        ]
            .filter(Boolean)
            .join('; ')
    );
</script>

<div class={cls} style={stl}></div>
