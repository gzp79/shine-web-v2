<script module lang="ts">
    import { type ResponsiveProp, toResponsiveVar } from '@lib/ui/atoms/_responsive-prop';
    import { cn } from '@lib/ui/utils';

    type MovingBlobProps = {
        src: string[];
        size?: ResponsiveProp<number>;
        excludedElement?: HTMLElement;
    };
</script>

<script lang="ts">
    let { src, size = 300, excludedElement }: MovingBlobProps = $props();

    let mouseX = $state(0);
    let mouseY = $state(0);
    let grayscaleBlend = $state(0);
    let mouseOutside = $state(true);

    function updatePosition(x: number, y: number) {
        mouseX = x;
        mouseY = y;
        mouseOutside = false;

        if (excludedElement) {
            const maxDistance = 30;
            const rect = excludedElement.getBoundingClientRect();

            //const dx = Math.max(rect.left - x, 0, x - rect.right);
            //const dy = Math.max(rect.top - y, 0, y - rect.bottom);
            //const distance = Math.sqrt(dx * dx + dy * dy);
            const distance = Math.max(rect.left - x + maxDistance / 2, 0);

            grayscaleBlend = Math.max(0, Math.min(1, 1 - distance / maxDistance));
        }
    }

    function handleMouseMove(event: MouseEvent) {
        updatePosition(event.clientX, event.clientY);
    }

    function handleTouchMove(event: TouchEvent) {
        if (event.touches.length > 0) {
            updatePosition(event.touches[0].clientX, event.touches[0].clientY);
        }
    }

    function handleMouseLeave(event: MouseEvent) {
        // Check if mouse left the document (relatedTarget is null when leaving the browser window)
        if (!event.relatedTarget) {
            mouseOutside = true;
        }
    }

    function handleTouchEnd() {
        mouseOutside = true;
    }

    $effect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('mouseout', handleMouseLeave);
        document.addEventListener('touchend', handleTouchEnd);
        document.addEventListener('touchcancel', handleTouchEnd);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('mouseout', handleMouseLeave);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('touchcancel', handleTouchEnd);
        };
    });

    const cls = $derived(
        cn(
            'blob-container',
            'absolute top-0 left-0 w-full h-full',
            'bg-cover bg-center bg-no-repeat bg-fixed',
            'pointer-events-none'
        )
    );

    let stl = $derived(
        [
            `--blob-x: ${mouseX}px`,
            `--blob-y: ${mouseY}px`,
            ...toResponsiveVar(size, (media, size) => `--blob-size${media}: ${size}px`),
            `--blob-gray: ${grayscaleBlend}`,
            `--blob-image: ${(typeof src === 'string' ? [src] : src).map((url) => `url(${url})`).join(',')}`,
            `--blob-opacity: ${mouseOutside ? 0 : 1}`
        ].join('; ')
    );
</script>

<div class={cls} style={stl}></div>

<style lang="postcss">
    .blob-container {
        --blob-media-size: var(--blob-size);
        opacity: var(--blob-opacity);

        background-image: var(--blob-image);

        mask-image: radial-gradient(
            circle var(--blob-media-size) at var(--blob-x) var(--blob-y),
            black 0%,
            transparent 100%
        );
        -webkit-mask-image: radial-gradient(
            circle var(--blob-media-size) at var(--blob-x) var(--blob-y),
            black 0%,
            transparent 100%
        );

        filter: grayscale(var(--blob-gray));
        transition: opacity 0.3s ease-out;
    }

    /* Breakpoints match app.css @theme values */
    @media (width >= 480px) {
        .blob-container {
            --blob-media-size: var(--blob-size-sm, var(--blob-size));
        }
    }

    @media (width >= 640px) {
        .blob-container {
            --blob-media-size: var(--blob-size-md, var(--blob-size-sm, var(--blob-size)));
        }
    }

    @media (width >= 768px) {
        .blob-container {
            --blob-media-size: var(--blob-size-lg, var(--blob-size-md, var(--blob-size-sm, var(--blob-size))));
        }
    }

    @media (width >= 1280px) {
        .blob-container {
            --blob-media-size: var(
                --blob-size-xl,
                var(--blob-size-lg, var(--blob-size-md, var(--blob-size-sm, var(--blob-size))))
            );
        }
    }
</style>
