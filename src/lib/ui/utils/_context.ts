import { getContext, hasContext, setContext } from 'svelte';

/// Creates a Svelte context with a unique key based on the provided name.
/// Similar to svelte's built-in context functions, but getter returns undefined if the context is not set.
export function createContext<T>(name: string): [() => T | undefined, (context: T) => void] {
    const key = Symbol(name);

    return [
        () => {
            if (!hasContext(key)) {
                return undefined;
            }

            return getContext(key);
        },
        (context) => setContext(key, context)
    ];
}
