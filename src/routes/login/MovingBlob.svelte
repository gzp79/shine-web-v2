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
            const rect = excludedElement.getBoundingClientRect();

            // Calculate distance from position to nearest edge of rectangle
            const dx = Math.max(rect.left - x, 0, x - rect.right);
            const dy = Math.max(rect.top - y, 0, y - rect.bottom);
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Blend factor: 1 when inside/close, 0 when far (300px away)
            const maxDistance = 30;
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
            `--mouse-x: ${mouseX}px`,
            `--mouse-y: ${mouseY}px`,
            ...toResponsiveVar(size, (media, size) => `--blob-size${media}: ${size}px`),
            `--grayscale: ${grayscaleBlend}`,
            `background-image: ${(typeof src === 'string' ? [src] : src).map((url) => `url(${url})`).join(',')}`,
            `opacity: ${mouseOutside ? 0 : 1}`,
            'transition: opacity 0.3s ease-out'
        ].join('; ')
    );
</script>

<div class={cls} style={stl}></div>

<style lang="postcss">
    .blob-container {
        --current-size: var(--blob-size);

        mask-image: radial-gradient(
            circle var(--current-size) at var(--mouse-x) var(--mouse-y),
            black 0%,
            transparent 100%
        );
        -webkit-mask-image: radial-gradient(
            circle var(--current-size) at var(--mouse-x) var(--mouse-y),
            black 0%,
            transparent 100%
        );
        filter: grayscale(var(--grayscale));
    }

    /* Breakpoints match app.css @theme values */
    @media (width >= 480px) {
        .blob-container {
            --current-size: var(--blob-size-sm, var(--blob-size));
        }
    }

    @media (width >= 640px) {
        .blob-container {
            --current-size: var(--blob-size-md, var(--blob-size-sm, var(--blob-size)));
        }
    }

    @media (width >= 768px) {
        .blob-container {
            --current-size: var(--blob-size-lg, var(--blob-size-md, var(--blob-size-sm, var(--blob-size))));
        }
    }

    @media (width >= 1280px) {
        .blob-container {
            --current-size: var(
                --blob-size-xl,
                var(--blob-size-lg, var(--blob-size-md, var(--blob-size-sm, var(--blob-size))))
            );
        }
    }
</style>
