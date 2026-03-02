/// Polyfills for happy-dom environment
/// happy-dom does not implement the Web Animations API (element.animate),
/// which is used by bits-ui components for dropdown/popover transitions.

if (typeof Element !== 'undefined' && !Element.prototype.animate) {
    Element.prototype.animate = function () {
        return {
            finished: Promise.resolve(),
            cancel: () => {},
            onfinish: null,
            oncancel: null,
            play: () => {},
            pause: () => {},
            reverse: () => {},
            persist: () => {},
            commitStyles: () => {},
            finish: () => {},
            currentTime: 0,
            playbackRate: 1,
            playState: 'finished',
            effect: null,
            timeline: null,
            id: '',
            startTime: 0,
            pending: false,
            replaceState: 'active',
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => true,
            updatePlaybackRate: () => {}
        } as unknown as Animation;
    };
}
