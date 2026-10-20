import { createContext as createSvelteContext } from 'svelte';

/// Creates a Svelte context with a named, type-safe accessor triplet.
export function createContext<T>(name: string): {
    get: () => T;
    tryGet: () => T | undefined;
    set: (context: T) => T;
} {
    const [get, set, has] = createSvelteContext<T>();

    return {
        get: () => {
            if (!has()) {
                throw new Error(`${name} was not provided by any ancestor component.`);
            }

            return get();
        },
        tryGet: () => (has() ? get() : undefined),
        set
    };
}
