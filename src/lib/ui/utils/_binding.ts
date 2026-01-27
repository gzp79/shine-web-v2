import type { Snippet } from 'svelte';

/**
 * Type-safe helper for Svelte 5 rune-based ref binding with snippets.
 * Usage example in a component:
 *   const el = $state<HTMLElement | null>(null);
 *   {@render snippet({ref: { get: () => el, set: (v) => (el = v) }})}
 *
 * In the snippet:
 *   <div bind:this={ref.get, ref.set} />
 *
 * This enables two-way binding for element references using runes,
 * ensuring type safety and compatibility with Svelte 5's recommended patterns.
 */
export type RefBinding<T extends HTMLElement = HTMLElement> = {
    get: () => T | null;
    set: (el: T | null) => void;
};

export type ChildOrChildren<T extends unknown[] = []> =
    | {
          child: Snippet<T>;
      }
    | {
          children?: Snippet;
      };

export function isChildSnippet<T extends unknown[]>(obj: unknown): obj is { child: Snippet<T> } {
    return typeof obj === 'object' && obj !== null && 'child' in obj;
}

export function isChildrenSnippet(obj: unknown): obj is { children: Snippet } {
    return typeof obj === 'object' && obj !== null && 'children' in obj;
}

export type AsChildSnippet<T extends unknown[] = []> = {
    asChild: Snippet<T>;
};

export function isAsChildSnippet<T extends unknown[] = []>(obj: unknown): obj is AsChildSnippet<T> {
    return typeof obj === 'object' && obj !== null && 'asChild' in obj;
}

export function asChildSnippet<T extends unknown[] = []>(snippet?: Snippet<T>): AsChildSnippet<T> | undefined {
    return snippet ? { asChild: snippet } : undefined;
}
