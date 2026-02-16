<script module lang="ts">
    import type { ClassValue } from 'clsx';
    import type { Snippet } from 'svelte';
    import type { HTMLAttributes } from 'svelte/elements';
    import { type AriaLive, type ResponsiveSpacing, toSpacingClasses } from '@lib/ui/atoms';
    import { type Overflow } from '@lib/ui/atoms/layouts';
    import { getContainerContext } from '@lib/ui/atoms/layouts/ContainerRoot.svelte';
    import { cn } from '@lib/ui/utils';

    export type T = HTMLAttributes<HTMLDivElement> & { aaa: string };

    export type ContainerContentProps = {
        padding?: ResponsiveSpacing;
        overflow?: Overflow;
        scrollShadow?: boolean;
        'data-slot': string;
        'aria-live'?: AriaLive;
        role?: string;
        class?: ClassValue | null;
        children: Snippet;
    };
</script>

<script lang="ts">
    let {
        padding = 4,
        overflow = 'hidden',
        scrollShadow = false,
        class: className = undefined,
        children,
        ...restProps
    }: ContainerContentProps = $props();

    let containerContext = getContainerContext();
    if (!containerContext) {
        throw new Error('ContainerContent must be used within a ContainerRoot');
    }

    const shadowSize = 24;
    let scrollFromTop = $state(0);
    let scrollFromLeft = $state(0);
    let scrollFromBottom = $state(0);
    let scrollFromRight = $state(0);
    let clientWidth = $state(0);
    let clientHeight = $state(0);

    const scrollClass: Record<Overflow, string> = {
        y: 'overflow-y-auto overflow-x-hidden flex-1',
        x: 'overflow-y-hidden overflow-x-auto w-full',
        xy: 'overflow-auto flex-1',
        hidden: ''
    };

    const contentCls = $derived(
        cn(
            'relative w-full',
            toSpacingClasses(padding, { all: 'p', x: 'px', y: 'py' }),
            scrollClass[overflow],
            overflow !== 'hidden' && scrollShadow && 'scroll-shadows',
            className
        )
    );

    const intensities = $derived({
        intensityTop: ['y', 'xy'].includes(overflow) ? Math.min(scrollFromTop / shadowSize, 1) : 0,
        intensityLeft: ['x', 'xy'].includes(overflow) ? Math.min(scrollFromLeft / shadowSize, 1) : 0,
        intensityBottom: ['y', 'xy'].includes(overflow) ? Math.min(-scrollFromBottom / shadowSize, 1) : 0,
        intensityRight: ['x', 'xy'].includes(overflow) ? Math.min(-scrollFromRight / shadowSize, 1) : 0
    });
    const stl = $derived(
        [
            `--scroll-shadow-color: var(--color-on-${containerContext.color})`
            // `--scroll-shadow-color: blue`,
            `--scroll-shadow-size: ${shadowSize}px`,
            `--scroll-shadow-top: ${scrollFromTop}px`,
            `--scroll-shadow-left: ${scrollFromLeft}px`,
            `--scroll-shadow-ch: ${clientHeight}px`,
            `--scroll-shadow-cw: ${clientWidth}px`,
            `--scroll-shadow-intensity-top: ${intensities.intensityTop}`,
            `--scroll-shadow-intensity-left: ${intensities.intensityLeft}`,
            `--scroll-shadow-intensity-bottom: ${intensities.intensityBottom}`,
            `--scroll-shadow-intensity-right: ${intensities.intensityRight}`
        ].join('; ')
    );

    const withScrollShadow = $derived(
        scrollShadow
            ? {
                  style: stl,
                  onscroll: (e: Event) => {
                      const target = e.currentTarget as HTMLElement;
                      scrollFromTop = Math.round(target.scrollTop);
                      scrollFromLeft = Math.round(target.scrollLeft);
                      scrollFromBottom = Math.round(target.scrollTop + target.clientHeight - target.scrollHeight);
                      scrollFromRight = Math.round(target.scrollLeft + target.clientWidth - target.scrollWidth);
                      clientWidth = Math.round(target.clientWidth);
                      clientHeight = Math.round(target.clientHeight);
                  }
              }
            : {}
    );
</script>

<div class={contentCls} {...withScrollShadow} {...restProps}>
    {@render children()}
</div>

<style>
    .scroll-shadows::after {
        content: '';
        position: absolute;
        top: var(--scroll-shadow-top);
        left: var(--scroll-shadow-left);
        width: var(--scroll-shadow-cw);
        height: var(--scroll-shadow-ch);
        pointer-events: none;

        background:
            radial-gradient(
                    farthest-side at 50% 0,
                    rgba(from var(--scroll-shadow-color) r g b / var(--scroll-shadow-intensity-top)),
                    rgba(0, 0, 0, 0)
                )
                100% 0,
            radial-gradient(
                    farthest-side at 0 50%,
                    rgba(from var(--scroll-shadow-color) r g b / var(--scroll-shadow-intensity-left)),
                    rgba(0, 0, 0, 0)
                )
                0% 50%,
            radial-gradient(
                    farthest-side at 100% 50%,
                    rgba(from var(--scroll-shadow-color) r g b / var(--scroll-shadow-intensity-right)),
                    rgba(0, 0, 0, 0)
                )
                100% 50%,
            radial-gradient(
                    farthest-side at 50% 100%,
                    rgba(from var(--scroll-shadow-color) r g b / var(--scroll-shadow-intensity-bottom)),
                    rgba(0, 0, 0, 0)
                )
                50% 100%;

        background-repeat: no-repeat;
        background-size:
            100% var(--scroll-shadow-size),
            var(--scroll-shadow-size) 100%,
            var(--scroll-shadow-size) 100%,
            100% var(--scroll-shadow-size);
        background-attachment: scroll, scroll, scroll, scroll;
    }
</style>
