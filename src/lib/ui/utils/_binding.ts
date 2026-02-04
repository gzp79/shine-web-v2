import type { Component, Snippet } from 'svelte';

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

/// Helper to distinct a generic snippet from a customized template Snippet
export type WrappedSnippet = {
    snippet: Snippet;
};

export function isWrappedSnippet(obj: unknown): obj is WrappedSnippet {
    return typeof obj === 'object' && obj !== null && 'snippet' in obj;
}

export function fromSnippet(snippet?: Snippet): WrappedSnippet | undefined {
    return snippet ? { snippet: snippet } : undefined;
}

/// Helper to distinct Component from a customized template Snippet
export type WrappedComponent = { component: Component };

export function isComponent(obj: unknown): obj is { component: Component } {
    return typeof obj === 'object' && obj !== null && 'component' in obj;
}

export function isWrappedComponent(obj: unknown): obj is WrappedComponent {
    return typeof obj === 'object' && obj !== null && 'component' in obj;
}

export function fromComponent(component?: Component): WrappedComponent | undefined {
    return component ? { component } : undefined;
}

/// Helper to accept either a generic children or a customized template Snippet
export type TemplateOrChildren<T extends unknown[] = []> =
    | {
          template: Snippet<T>;
      }
    | {
          children?: Snippet;
      };

export function isTemplateSnippet<T extends unknown[]>(obj: unknown): obj is { template: Snippet<T> } {
    return typeof obj === 'object' && obj !== null && 'template' in obj;
}

export function isChildrenSnippet(obj: unknown): obj is { children: Snippet } {
    return typeof obj === 'object' && obj !== null && 'children' in obj;
}
