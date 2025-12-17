import type { Cookies } from '@sveltejs/kit';
import { getContext, setContext } from 'svelte';
import { getCookie, setCookie } from '@lib/utils';

export type Theme = 'light' | 'dark' | 'system';
export const themeList: Theme[] = ['light', 'dark', 'system'];
export const defaultTheme = 'system' as Theme;

function normalizeTheme(candidate?: string | null): Theme {
    return themeList.includes(candidate as Theme) ? (candidate as Theme) : defaultTheme;
}

export async function loadThemeServerSide(cookies: Cookies): Promise<Theme> {
    return normalizeTheme(cookies.get('theme'));
}

export function loadThemeClientSide(fallback: Theme = defaultTheme): Theme {
    return normalizeTheme(getCookie('theme') ?? fallback);
}

const THEME_CONTEXT_KEY = Symbol('theme-context');

export type ThemeContext = ReturnType<typeof createThemeContext>;

export function createThemeContext() {
    let rune = $state(defaultTheme);

    $effect(() => {
        setCookie('theme', rune);
    });

    const store = {
        get current() {
            return rune;
        },
        set current(value: Theme) {
            rune = normalizeTheme(value);
        }
    };
    setContext(THEME_CONTEXT_KEY, store);

    return store;
}

export function getThemeContext(): ThemeContext {
    return getContext<ThemeContext>(THEME_CONTEXT_KEY);
}
