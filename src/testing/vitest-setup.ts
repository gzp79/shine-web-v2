/// Math.clamp / Math.round_q extensions, installed at app entry (hooks.client/server) but
/// not otherwise present under Vitest.
import '#lib/prelude-math';

/// happy-dom rejects `Animation.finished` on `cancel()` like browsers do, but Svelte's transitions
/// cancel animations without listening to it, which Vitest reports as an unhandled rejection.
const cancel = Animation.prototype.cancel;
Animation.prototype.cancel = function (this: Animation) {
    this.finished.catch(() => {});
    cancel.call(this);
};
