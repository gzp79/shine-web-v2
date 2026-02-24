import type { Attachment } from 'svelte/attachments';
import type { Overflow } from './index';

export type ScrollShadowParameters = {
    overflow: Overflow;
    shadowColor?: string;
    shadowSize?: number;
};

/**
 * Creates a scroll shadow attachment for scrollable elements.
 * The shadows fade in/out based on scroll position and automatically update when parameters change.
 *
 * @param overflow - The scroll direction ('y', 'x', 'xy', or 'hidden')
 * @param shadowColor - CSS color for the shadow (defaults to 'currentColor')
 * @param shadowSize - Size of the shadow in pixels (defaults to 24)
 * @returns Attachment function
 *
 * @example
 * ```svelte
 * <div {@attach scrollShadow('y', 'var(--color-on-container)')}>
 *   <!-- scrollable content -->
 * </div>
 * ```
 */
export function scrollShadow(
    overflow: Overflow,
    shadowColor: string = 'currentColor',
    shadowSize: number = 24
): Attachment<HTMLElement> {
    return (node) => {
        const updateStyles = () => {
            const scrollFromTop = Math.round(node.scrollTop);
            const scrollFromLeft = Math.round(node.scrollLeft);
            const scrollFromBottom = Math.round(node.scrollTop + node.clientHeight - node.scrollHeight);
            const scrollFromRight = Math.round(node.scrollLeft + node.clientWidth - node.scrollWidth);
            const clientWidth = Math.round(node.clientWidth);
            const clientHeight = Math.round(node.clientHeight);

            const intensityTop = ['y', 'xy'].includes(overflow) ? Math.min(scrollFromTop / shadowSize, 1) : 0;
            const intensityLeft = ['x', 'xy'].includes(overflow) ? Math.min(scrollFromLeft / shadowSize, 1) : 0;
            const intensityBottom = ['y', 'xy'].includes(overflow) ? Math.min(-scrollFromBottom / shadowSize, 1) : 0;
            const intensityRight = ['x', 'xy'].includes(overflow) ? Math.min(-scrollFromRight / shadowSize, 1) : 0;

            node.style.setProperty('--ss-clr', shadowColor);
            node.style.setProperty('--ss-size', `${shadowSize}px`);
            node.style.setProperty('--ss-top', `${scrollFromTop}px`);
            node.style.setProperty('--ss-left', `${scrollFromLeft}px`);
            node.style.setProperty('--ss-h', `${clientHeight}px`);
            node.style.setProperty('--ss-w', `${clientWidth}px`);
            node.style.setProperty('--ss-i-t', `${intensityTop}`);
            node.style.setProperty('--ss-i-l', `${intensityLeft}`);
            node.style.setProperty('--ss-i-b', `${intensityBottom}`);
            node.style.setProperty('--ss-i-r', `${intensityRight}`);
        };

        const handleScroll = () => {
            updateStyles();
        };

        const resizeObserver = new ResizeObserver(() => {
            updateStyles();
        });

        node.dataset.scrollShadow = '';
        node.addEventListener('scroll', handleScroll);
        resizeObserver.observe(node);
        updateStyles();

        return () => {
            node.removeEventListener('scroll', handleScroll);
            resizeObserver.disconnect();
            delete node.dataset.scrollShadow;
        };
    };
}
