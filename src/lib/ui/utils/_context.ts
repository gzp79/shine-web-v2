import { getContext, hasContext, setContext } from 'svelte';

/// Creates a Svelte context with a unique key based on the provided name.
/// Improved version of svelte's built-in context functions.
export function createContext<T>(name: string): {
    get: () => T;
    tryGet: () => T | undefined;
    set: (context: T) => void;
} {
    const key = Symbol(name);

    return {
        get: () => getContext(key),
        tryGet: () => {
            if (!hasContext(key)) {
                return undefined;
            }

            return getContext(key);
        },
        set: (context) => setContext(key, context)
    };
}
