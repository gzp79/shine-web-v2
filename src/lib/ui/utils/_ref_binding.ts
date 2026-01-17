/**
 * Helper type for Svelte 5 rune-based ref binding.
 * Usage in component:
 *   let el = $state<HTMLElement | null>(null);
 *   const ref: RefBinding = {
 *     get: () => el,
 *     set: (v) => (el = v)
 *   };
 *   // In markup: bind:this={ref.get, ref.set}
 */
export type RefBinding<T extends HTMLElement = HTMLElement> = {
    get: () => T | null;
    set: (el: T | null) => void;
};
