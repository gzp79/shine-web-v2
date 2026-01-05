import { browser } from '$app/environment';
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

export function loadTheme(fallback: Theme = defaultTheme): Theme {
    if (!browser) {
        return fallback;
    }

    return normalizeTheme(getCookie('theme') ?? fallback);
}

const THEME_CONTEXT_KEY = Symbol('theme-context');

export type ThemeContext = {
    current: Theme;
};

export function createThemeContext(): ThemeContext {
    let rune = $state(loadTheme());

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
