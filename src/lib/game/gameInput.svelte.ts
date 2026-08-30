/**
 * Ref-counted gate that decides whether the embedded game should respond to input right now.
 *
 * The game (loaded as a separate bundle on the `/game` route) listens for keyboard/pointer input at
 * the window/canvas level. While an overlay such as a dialog is open, that input must be suspended
 * so keystrokes reach the dialog's fields and the camera doesn't move behind the overlay. Overlays
 * call {@link GameInputGate.suspend} while open; the game page mirrors {@link GameInputGate.suspended}
 * onto the running viewer.
 *
 * Ref-counted so overlapping overlays each hold an independent claim — the game only resumes once the
 * last one is released.
 */
export class GameInputGate {
    // The claim count is the source of truth, but it is a plain (non-reactive) field: callers mutate
    // it via read-modify-write from inside an `$effect`, and a reactive counter there would make that
    // effect depend on the state it just wrote and re-trigger forever. Reactivity is exposed instead
    // through `#suspended`, which is only ever *assigned* (never read) by the mutations — so no caller
    // can accidentally take a dependency on it, and consumers reading `suspended` still update.
    #claims = 0;
    #suspended = $state(false);

    /** True while at least one caller is holding the game's input suspended. */
    get suspended(): boolean {
        return this.#suspended;
    }

    /**
     * Request the game to suspend input. Returns a release function; call it when the overlay closes
     * (e.g. from an `$effect` cleanup). The release is idempotent — calling it more than once only
     * drops this claim once, so it can never release another caller's claim.
     */
    suspend(): () => void {
        this.#claims += 1;
        this.#suspended = this.#claims > 0;
        let released = false;
        return () => {
            if (released) return;
            released = true;
            this.#claims -= 1;
            this.#suspended = this.#claims > 0;
        };
    }
}

/** App-wide gate shared between overlays (producers) and the game page (consumer). */
export const gameInputGate = new GameInputGate();
